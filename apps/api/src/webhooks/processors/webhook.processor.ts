import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MessageDirection, MessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { Inject } from '@nestjs/common';
import { WHATSAPP_PROVIDER } from '../../whatsapp-adapter/whatsapp-provider.token';
import type { WhatsAppProvider, ParsedWebhookEvent } from '../../whatsapp-adapter/whatsapp-provider.interface';

interface WebhookJobData {
  payload: unknown;
}

const STATUS_MAP: Record<string, MessageStatus> = {
  sent: MessageStatus.SENT,
  delivered: MessageStatus.DELIVERED,
  read: MessageStatus.READ,
  failed: MessageStatus.FAILED,
};


@Processor(QUEUE_NAMES.WEBHOOK_PROCESS)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider,
  ) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    let events: ParsedWebhookEvent[];
    try {
      events = this.provider.parseWebhookPayload(job.data.payload);
    } catch (err) {
      this.logger.warn(`Malformed webhook payload, skipping: ${(err as Error).message}`);
      return;
    }

    for (const event of events) {
      try {
        if (event.kind === 'status') {
          await this.applyStatusEvent(event);
        } else {
          await this.applyInboundEvent(event);
        }
      } catch (err) {
        // One bad event must not stop the rest of the batch from applying.
        this.logger.warn(`Failed to apply webhook event, skipping: ${(err as Error).message}`);
      }
    }
  }

  private async applyStatusEvent(event: Extract<ParsedWebhookEvent, { kind: 'status' }>) {
    const dedupeKey = `${event.providerMessageId}:${event.status}:${event.timestamp.getTime()}`;

    const message = await this.prisma.message.findUnique({
      where: { providerMessageId: event.providerMessageId },
    });
    if (!message) {
      this.logger.warn(`No local message found for provider id ${event.providerMessageId} — ignoring`);
      return;
    }

    try {
      await this.prisma.webhookEvent.create({
        data: {
          messageId: message.id,
          whatsappAccountId: message.whatsappAccountId,
          dedupeKey,
          type: event.status,
          rawPayload: event as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        this.logger.debug(`Duplicate webhook event ${dedupeKey}, skipping status update`);
        return;
      }
      throw err;
    }

    const status = STATUS_MAP[event.status];
    if (!status) return;

    const timestampField =
      status === MessageStatus.SENT ? 'sentAt' : status === MessageStatus.DELIVERED ? 'deliveredAt' : status === MessageStatus.READ ? 'readAt' : undefined;

    await this.prisma.message.update({
      where: { id: message.id },
      data: {
        status,
        errorMessage: event.errorMessage,
        ...(timestampField ? { [timestampField]: event.timestamp } : {}),
      },
    });

    const recipient = await this.prisma.campaignRecipient.findUnique({ where: { messageId: message.id } });
    if (recipient) {
      await this.prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status, error: event.errorMessage, lastStatusChangeAt: new Date() },
      });
    }
  }

  private async applyInboundEvent(event: Extract<ParsedWebhookEvent, { kind: 'inbound' }>) {
    const contact = await this.prisma.contact.findUnique({ where: { phone: event.from } });
    if (!contact) {
      this.logger.warn(`Inbound message from unknown contact ${event.from} — logging without a contact link`);
      return;
    }

    const dedupeKey = `inbound:${event.providerMessageId}`;
    const whatsappAccount = await this.prisma.whatsAppAccount.findFirst({ where: { companyId: contact.companyId, isActive: true } });
    if (!whatsappAccount) return;

    try {
      const message = await this.prisma.message.create({
        data: {
          contactId: contact.id,
          whatsappAccountId: whatsappAccount.id,
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          providerMessageId: event.providerMessageId,
          body: event.body,
        },
      });

      await this.prisma.webhookEvent.create({
        data: {
          messageId: message.id,
          whatsappAccountId: whatsappAccount.id,
          dedupeKey,
          type: 'inbound',
          rawPayload: event as unknown as Prisma.InputJsonValue,
        },
      });

      // Re-opens the 24h free-form session window (Section 10.3).
      await this.prisma.contact.update({ where: { id: contact.id }, data: { lastInboundAt: event.timestamp } });
    } catch (err: any) {
      if (err.code === 'P2002') {
        this.logger.debug(`Duplicate inbound event ${dedupeKey}, skipping`);
        return;
      }
      throw err;
    }
  }
}
