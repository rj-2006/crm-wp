import { Test, TestingModule } from '@nestjs/testing';
import { CampaignProcessor } from '../../src/campaigns/processors/campaign.processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../src/queue/queue.constants';
import { cleanDatabase } from './db-cleanup';
import { CrmCampaignStatus, CrmTemplateApprovalStatus, CrmConsentStatus } from '@prisma/client';

describe('CampaignProcessor (Integration)', () => {
  let processor: CampaignProcessor;
  let prisma: PrismaService;

  const mockMessageQueue = { addBulk: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignProcessor,
        PrismaService,
        {
          provide: getQueueToken(QUEUE_NAMES.MESSAGE_SEND),
          useValue: mockMessageQueue,
        },
      ],
    }).compile();

    processor = module.get<CampaignProcessor>(CampaignProcessor);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    mockMessageQueue.addBulk.mockClear();
    await cleanDatabase(prisma);
  });

  describe('process', () => {
    it('should find matching contacts, create recipients, and enqueue messages', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const tag = await prisma.tag.create({ data: { companyId: company.id, name: 'VIP' } });
      
      // Contact 1: Opted In, Has VIP Tag (Matches)
      const contact1 = await prisma.contact.create({
        data: { companyId: company.id, phone: '+111', consentStatus: CrmConsentStatus.OPTED_IN },
      });
      await prisma.contactTag.create({ data: { contactId: contact1.id, tagId: tag.id } });

      // Contact 2: Opted Out, Has VIP Tag (Does NOT match due to consent)
      const contact2 = await prisma.contact.create({
        data: { companyId: company.id, phone: '+222', consentStatus: CrmConsentStatus.OPTED_OUT },
      });
      await prisma.contactTag.create({ data: { contactId: contact2.id, tagId: tag.id } });

      // Contact 3: Opted In, No Tag (Does NOT match due to filter)
      await prisma.contact.create({
        data: { companyId: company.id, phone: '+333', consentStatus: CrmConsentStatus.OPTED_IN },
      });

      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'welcome', approvalStatus: CrmTemplateApprovalStatus.APPROVED },
      });

      const account = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });

      const campaign = await prisma.campaign.create({
        data: {
          companyId: company.id,
          name: 'Promo',
          status: CrmCampaignStatus.SCHEDULED,
          templateId: template.id,
          whatsappAccountId: account.id,
          segmentFilter: { tagId: tag.id },
        },
      });

      // 2. Act
      await processor.process({ data: { campaignId: campaign.id } } as any);

      // 3. Assert
      // Only contact1 should have been selected
      const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaign.id } });
      expect(updatedCampaign?.status).toBe(CrmCampaignStatus.RUNNING);
      expect(updatedCampaign?.totalRecipients).toBe(1);

      const recipients = await prisma.campaignRecipient.findMany({ where: { campaignId: campaign.id } });
      expect(recipients).toHaveLength(1);
      expect(recipients[0].contactId).toBe(contact1.id);
      expect(recipients[0].status).toBe('PENDING');

      // Ensure the message was enqueued to MESSAGE_SEND queue
      expect(mockMessageQueue.addBulk).toHaveBeenCalledTimes(1);
      const enqueuedJobs = mockMessageQueue.addBulk.mock.calls[0][0];
      expect(enqueuedJobs).toHaveLength(1);
      expect(enqueuedJobs[0].name).toBe('send-campaign-message');
      expect(enqueuedJobs[0].data.recipientId).toBe(recipients[0].id);
    });

    it('should complete immediately if no contacts match', async () => {
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'welcome' },
      });
      const campaign = await prisma.campaign.create({
        data: {
          companyId: company.id,
          name: 'Promo',
          status: CrmCampaignStatus.SCHEDULED,
          templateId: template.id,
          segmentFilter: { tagId: '00000000-0000-0000-0000-000000000000' },
        },
      });

      await processor.process({ data: { campaignId: campaign.id } } as any);

      const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaign.id } });
      expect(updatedCampaign?.status).toBe(CrmCampaignStatus.COMPLETED);
      expect(updatedCampaign?.totalRecipients).toBe(0);
      expect(mockMessageQueue.addBulk).not.toHaveBeenCalled();
    });
  });
});
