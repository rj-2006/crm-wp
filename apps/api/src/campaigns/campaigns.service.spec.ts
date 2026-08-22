import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CrmCampaignStatus } from '@prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: PrismaService;

  const mockPrisma = {
    messageTemplate: {
      findFirst: jest.fn(),
    },
    whatsAppAccount: {
      findFirst: jest.fn(),
    },
    campaign: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockExecuteQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_NAMES.CAMPAIGN_EXECUTE), useValue: mockExecuteQueue },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if template does not exist', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.create('company-1', 'user-1', {
          name: 'Promo',
          templateId: 'tpl-1',
          whatsappAccountId: 'wa-1',
          segmentFilter: { tagId: 'tag-1' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if template is not APPROVED', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue({
        id: 'tpl-1',
        approvalStatus: 'PENDING',
      });

      await expect(
        service.create('company-1', 'user-1', {
          name: 'Promo',
          templateId: 'tpl-1',
          whatsappAccountId: 'wa-1',
          segmentFilter: { tagId: 'tag-1' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if whatsapp account is inactive or missing', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue({
        id: 'tpl-1',
        approvalStatus: 'APPROVED',
      });
      mockPrisma.whatsAppAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.create('company-1', 'user-1', {
          name: 'Promo',
          templateId: 'tpl-1',
          whatsappAccountId: 'wa-1',
          segmentFilter: { tagId: 'tag-1' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a DRAFT campaign if validations pass', async () => {
      mockPrisma.messageTemplate.findFirst.mockResolvedValue({
        id: 'tpl-1',
        approvalStatus: 'APPROVED',
      });
      mockPrisma.whatsAppAccount.findFirst.mockResolvedValue({
        id: 'wa-1',
        active: true,
      });

      mockPrisma.campaign.create.mockResolvedValue({
        id: 'camp-1',
        status: 'DRAFT',
      });

      const result = await service.create('company-1', 'user-1', {
        name: 'Promo',
        templateId: 'tpl-1',
        whatsappAccountId: 'wa-1',
        segmentFilter: { tagId: 'tag-1' },
      });

      expect(result.id).toEqual('camp-1');
      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'company-1',
          status: 'DRAFT',
          segmentFilter: { tagId: 'tag-1' },
        }),
      });
    });
  });
});
