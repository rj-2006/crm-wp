import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CrmCampaignStatus } from '@prisma/client';

interface CampaignExecuteData {
  campaignId: string;
}

@Processor(QUEUE_NAMES.CAMPAIGN_EXECUTE)
export class CampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MESSAGE_SEND) private messageSendQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<CampaignExecuteData>): Promise<void> {
    const { campaignId } = job.data;
    this.logger.log(`Starting execution of campaign ${campaignId}`);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign) {
      this.logger.error(`Campaign ${campaignId} not found`);
      return;
    }

    if (!campaign.template) {
      this.logger.error(`Campaign ${campaignId} has no template attached`);
      return;
    }

    // Mark as RUNNING
    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CrmCampaignStatus.RUNNING },
    });

    // Extract segment filter (assuming V1 is just { tagId: "uuid" })
    const filter = campaign.segmentFilter as { tagId?: string };
    
    // Find all OPTED_IN contacts matching the filter
    const contacts = await this.prisma.contact.findMany({
      where: {
        companyId: campaign.companyId ?? undefined,
        consentStatus: 'OPTED_IN',
        ...(filter?.tagId
          ? { tags: { some: { tagId: filter.tagId } } }
          : {}),
      },
    });

    if (contacts.length === 0) {
      this.logger.warn(`Campaign ${campaignId} has 0 matching opted-in contacts.`);
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: CrmCampaignStatus.COMPLETED, totalRecipients: 0 },
      });
      return;
    }

    this.logger.log(`Found ${contacts.length} recipients for campaign ${campaignId}`);

    // Create CampaignRecipient records
    // Since we need them created before enqueuing toMESSAGE_SEND, we do it in a transaction or bulk insert
    const recipientsData = contacts.map(c => ({
      campaignId: campaign.id,
      contactId: c.id,
      status: 'PENDING' as any,
    }));

    await this.prisma.campaignRecipient.createMany({
      data: recipientsData,
      skipDuplicates: true, // In case of retries
    });

    // Fetch the newly created recipients to get their IDs
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id },
    });

    // Enqueue jobs to MESSAGE_SEND queue
    const jobsToEnqueue = recipients.map(recipient => ({
      name: 'send-campaign-message',
      data: {
        campaignId: campaign.id,
        recipientId: recipient.id,
        contactId: recipient.contactId,
        templateId: campaign.templateId,
        whatsappAccountId: campaign.whatsappAccountId,
        companyId: campaign.companyId,
      },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    }));

    // BullMQ bulk enqueue
    await this.messageSendQueue.addBulk(jobsToEnqueue);

    // Update campaign totals
    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { totalRecipients: recipients.length },
    });

    this.logger.log(`Successfully enqueued ${recipients.length} messages for campaign ${campaignId}`);
  }
}
