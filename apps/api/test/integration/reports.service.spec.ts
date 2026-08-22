import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../src/reports/reports.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase } from './db-cleanup';
import { CrmCampaignStatus, CrmTemplateApprovalStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ReportsService (Integration)', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, PrismaService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('getCampaignSummary', () => {
    it('should calculate accurate rates for a campaign', async () => {
      const company = await prisma.company.create({ data: { name: 'Report Corp' } });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'promo', approvalStatus: CrmTemplateApprovalStatus.APPROVED },
      });
      const campaign = await prisma.campaign.create({
        data: {
          companyId: company.id,
          name: 'Promo Blast',
          status: CrmCampaignStatus.COMPLETED,
          templateId: template.id,
          totalRecipients: 1000,
          sentCount: 900,
          deliveredCount: 800,
          readCount: 500,
          failedCount: 100,
        },
      });

      const report = await service.getCampaignSummary(company.id, campaign.id);

      expect(report.campaignId).toBe(campaign.id);
      expect(report.metrics.total).toBe(1000);
      expect(report.metrics.delivered).toBe(800);
      
      // Rates based on totalRecipients (1000)
      expect(report.rates.deliveryRate).toBe(80); // (800 / 1000) * 100
      expect(report.rates.readRate).toBe(50);     // (500 / 1000) * 100
      expect(report.rates.failureRate).toBe(10);  // (100 / 1000) * 100
    });

    it('should safely handle division by zero when totalRecipients is 0', async () => {
      const company = await prisma.company.create({ data: { name: 'Report Corp' } });
      const campaign = await prisma.campaign.create({
        data: {
          companyId: company.id,
          name: 'Empty Blast',
          status: CrmCampaignStatus.COMPLETED,
          totalRecipients: 0,
          deliveredCount: 0,
        },
      });

      const report = await service.getCampaignSummary(company.id, campaign.id);

      expect(report.rates.deliveryRate).toBe(0);
      expect(report.rates.readRate).toBe(0);
      expect(report.rates.failureRate).toBe(0);
    });

    it('should throw NotFoundException if campaign belongs to another company', async () => {
      const companyA = await prisma.company.create({ data: { name: 'Company A' } });
      const companyB = await prisma.company.create({ data: { name: 'Company B' } });
      
      const campaign = await prisma.campaign.create({
        data: {
          companyId: companyA.id,
          name: 'Blast A',
          status: CrmCampaignStatus.COMPLETED,
          totalRecipients: 100,
        },
      });

      // Try to read companyA's campaign using companyB's ID
      await expect(service.getCampaignSummary(companyB.id, campaign.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGlobalMetrics', () => {
    it('should aggregate metrics across all campaigns for a specific company', async () => {
      const company = await prisma.company.create({ data: { name: 'Global Corp' } });
      
      await prisma.campaign.createMany({
        data: [
          { companyId: company.id, name: 'C1', totalRecipients: 100, deliveredCount: 50 },
          { companyId: company.id, name: 'C2', totalRecipients: 200, deliveredCount: 100 },
        ]
      });

      // Another company's campaigns (should be ignored)
      const otherCompany = await prisma.company.create({ data: { name: 'Other Corp' } });
      await prisma.campaign.create({
        data: { companyId: otherCompany.id, name: 'C3', totalRecipients: 500, deliveredCount: 500 },
      });

      const globalReport = await service.getGlobalMetrics(company.id);

      expect(globalReport.totalCampaigns).toBe(2);
      expect(globalReport.metrics.totalRecipients).toBe(300); // 100 + 200
      expect(globalReport.metrics.delivered).toBe(150); // 50 + 100
      expect(globalReport.rates.globalDeliveryRate).toBe(50); // (150 / 300) * 100
    });
  });
});
