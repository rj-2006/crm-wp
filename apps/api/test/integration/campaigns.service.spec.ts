import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from '../../src/campaigns/campaigns.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../src/queue/queue.constants';
import { cleanDatabase } from './db-cleanup';
import { CrmCampaignStatus, CrmTemplateApprovalStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CampaignsService (Integration)', () => {
  let service: CampaignsService;
  let prisma: PrismaService;

  const mockExecuteQueue = { add: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        PrismaService,
        {
          provide: getQueueToken(QUEUE_NAMES.CAMPAIGN_EXECUTE),
          useValue: mockExecuteQueue,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    mockExecuteQueue.add.mockClear();
    await cleanDatabase(prisma);
  });

  describe('create', () => {
    it('should create a campaign in DRAFT status', async () => {
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const user = await prisma.user.create({ data: { companyId: company.id, name: 'User', email: 'u@test.com', passwordHash: 'hash' } });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'welcome', approvalStatus: CrmTemplateApprovalStatus.APPROVED },
      });
      const account = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });

      const campaign = await service.create(company.id, user.id, {
        name: 'My Campaign',
        templateId: template.id,
        whatsappAccountId: account.id,
        segmentFilter: { tagId: 'some-tag-id' },
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe(CrmCampaignStatus.DRAFT);
      expect((campaign.segmentFilter as any).tagId).toBe('some-tag-id');
    });

    it('should fail if template is not APPROVED', async () => {
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const user = await prisma.user.create({ data: { companyId: company.id, name: 'User', email: 'u@test.com', passwordHash: 'hash' } });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'welcome', approvalStatus: CrmTemplateApprovalStatus.PENDING },
      });
      const account = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });

      await expect(service.create(company.id, user.id, {
        name: 'My Campaign',
        templateId: template.id,
        whatsappAccountId: account.id,
        segmentFilter: { tagId: 'some-tag-id' },
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('execute', () => {
    it('should mark campaign as SCHEDULED and enqueue job', async () => {
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const account = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });
      const campaign = await prisma.campaign.create({
        data: { companyId: company.id, name: 'Test', status: CrmCampaignStatus.DRAFT, whatsappAccountId: account.id },
      });

      const result = await service.execute(company.id, campaign.id);

      expect(result.status).toBe(CrmCampaignStatus.SCHEDULED);
      expect(mockExecuteQueue.add).toHaveBeenCalledWith('execute-campaign', { campaignId: campaign.id });
    });

    it('should fail if campaign is not in DRAFT status', async () => {
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const account = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });
      const campaign = await prisma.campaign.create({
        data: { companyId: company.id, name: 'Test', status: CrmCampaignStatus.RUNNING, whatsappAccountId: account.id },
      });

      await expect(service.execute(company.id, campaign.id)).rejects.toThrow(BadRequestException);
    });
  });
});
