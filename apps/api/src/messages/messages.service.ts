import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CrmMessageDirection, CrmMessageStatus, CrmTemplateApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { SendMessageDto } from './dto/send-message.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    @InjectQueue(QUEUE_NAMES.MESSAGE_SEND) private sendQueue: Queue,
  ) {}

  async sendOne(companyId: string, actorId: string, dto: SendMessageDto) {
    const contact = await this.prisma.contact.findFirst({ where: { id: dto.contactId, companyId } });
    if (!contact) throw new NotFoundException('Contact not found');
    if (contact.consentStatus === 'OPTED_OUT') {
      throw new BadRequestException('Contact has opted out and cannot be messaged');
    }

    const template = await this.prisma.messageTemplate.findFirst({
      where: { companyId, name: dto.templateName, approvalStatus: CrmTemplateApprovalStatus.APPROVED },
    });
    if (!template) throw new BadRequestException('Template is not approved for sending');

    const whatsappAccount = await this.prisma.whatsAppAccount.findFirst({
      where: { companyId, active: true },
    });
    if (!whatsappAccount) throw new BadRequestException('No active WhatsApp account configured');

    const message = await this.prisma.message.create({
      data: {
        contactId: contact.id,
        whatsappAccountId: whatsappAccount.id,
        templateId: template.id,
        direction: CrmMessageDirection.OUTBOUND,
        status: CrmMessageStatus.QUEUED,
        // structurePayload holds the Meta template shape; extract body string if present
        body: this.renderPreview((template.structurePayload as any)?.body ?? '', dto.bodyParams ?? []),
      },
    });

    await this.sendQueue.add(
      'send',
      { messageId: message.id, to: contact.phone, templateName: template.name, language: template.language, bodyParams: dto.bodyParams ?? [] },
      { jobId: `msg:${message.id}`, attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false },
    );

    await this.audit.activity({ companyId, contactId: contact.id, userId: actorId, action: `message.queued (${template.name})` });

    return message;
  }

  historyForContact(companyId: string, contactId: string) {
    return this.prisma.message.findMany({
      where: { contactId, contact: { companyId } },
      orderBy: { createdAt: 'desc' },
      include: { template: true, webhookEvents: true },
    });
  }

  private renderPreview(template: string, params: string[]): string {
    return params.reduce((body, p, i) => body.replace(`{{${i + 1}}}`, p), template);
  }
}
