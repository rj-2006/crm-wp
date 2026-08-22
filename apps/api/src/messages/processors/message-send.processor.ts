import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MessageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { WHATSAPP_PROVIDER } from '../../whatsapp-adapter/whatsapp-provider.token';
import type { WhatsAppProvider } from '../../whatsapp-adapter/whatsapp-provider.interface';
import { PermanentProviderError, TransientProviderError } from '../../whatsapp-adapter/whatsapp-provider.interface';

interface SendJobData {
  messageId: string;
  to: string;
  templateName: string;
  language: string;
  bodyParams: string[];
}


@Processor(QUEUE_NAMES.MESSAGE_SEND)
export class MessageSendProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageSendProcessor.name);

  constructor(
    private prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider,
  ) {
    super();
  }

  async process(job: Job<SendJobData>): Promise<void> {
    const { messageId, to, templateName, language, bodyParams } = job.data;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { whatsappAccount: true, campaignRecipient: true },
    });
    if (!message) {
      this.logger.warn(`Message ${messageId} no longer exists — skipping job`);
      return;
    }

    try {
      const result = await this.provider.sendTemplateMessage({
        whatsappAccountId: message.whatsappAccountId,
        to,
        templateName,
        language,
        bodyParams,
      });

      await this.markStatus(message.id, MessageStatus.SENT, {
        providerMessageId: result.providerMessageId,
        sentAt: new Date(),
      });
    } catch (err) {
      if (err instanceof TransientProviderError) {
        // Rethrow so BullMQ applies the configured backoff/attempts.
        this.logger.warn(`Transient error sending message ${messageId}, will retry: ${err.message}`);
        throw err;
      }

      if (err instanceof PermanentProviderError) {

        this.logger.error(`Permanent failure sending message ${messageId}: ${err.message}`);
        await this.markStatus(message.id, MessageStatus.FAILED, { errorMessage: err.message });
        return;
      }


      this.logger.error(`Unclassified error sending message ${messageId}: ${(err as Error).message}`);
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<SendJobData>, err: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {

      await this.markStatus(job.data.messageId, MessageStatus.FAILED, {
        errorMessage: `Exhausted retries: ${err.message}`,
      });
    }
  }

  private async markStatus(
    messageId: string,
    status: MessageStatus,
    extra: Partial<{ providerMessageId: string; sentAt: Date; errorMessage: string }>,
  ) {
    await this.prisma.message.update({ where: { id: messageId }, data: { status, ...extra } });

    const recipient = await this.prisma.campaignRecipient.findUnique({ where: { messageId } });
    if (recipient) {
      await this.prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status, error: extra.errorMessage, lastStatusChangeAt: new Date() },
      });
    }
  }
}
