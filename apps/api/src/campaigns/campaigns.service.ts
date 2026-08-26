import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { Queue } from 'bullmq';
import { CrmCampaignStatus } from '@prisma/client';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsString()
  @IsNotEmpty()
  whatsappAccountId!: string;

  @IsObject()
  segmentFilter!: { tagId: string }; // We'll stick to a simple tag string for V1 as recommended
}

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.CAMPAIGN_EXECUTE) private executeQueue: Queue,
  ) {}

  async create(companyId: string, userId: string, dto: CreateCampaignDto) {
    // Ensure template exists and is approved
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: dto.templateId, companyId },
    });
    if (!template) throw new NotFoundException('Template not found');
    if (template.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Cannot create a campaign with an unapproved template');
    }

    // Ensure whatsapp account exists
    const account = await this.prisma.whatsAppAccount.findFirst({
      where: { id: dto.whatsappAccountId, companyId, active: true },
    });
    if (!account) throw new NotFoundException('WhatsApp account not found or inactive');

    // Create the draft campaign
    return this.prisma.campaign.create({
      data: {
        companyId,
        createdBy: userId,
        name: dto.name,
        templateId: dto.templateId,
        whatsappAccountId: dto.whatsappAccountId,
        status: CrmCampaignStatus.DRAFT,
        segmentFilter: dto.segmentFilter as any,
      },
    });
  }

  async execute(companyId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, companyId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    
    if (campaign.status !== CrmCampaignStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT campaigns can be executed');
    }

    if (!campaign.whatsappAccountId) {
      throw new BadRequestException('Campaign is missing a WhatsApp account ID');
    }

    // Ensure whatsapp account is still active
    const account = await this.prisma.whatsAppAccount.findFirst({
      where: { id: campaign.whatsappAccountId, companyId, active: true },
    });
    if (!account) {
      throw new BadRequestException('WhatsApp account is missing or inactive');
    }

    // Update status to SCHEDULED
    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CrmCampaignStatus.SCHEDULED },
    });

    // Enqueue job for background processing
    await this.executeQueue.add('execute-campaign', { campaignId: updated.id });
    
    return updated;
  }

  async findOne(companyId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, companyId },
      include: { template: true, whatsappAccount: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async findAll(companyId: string, skip: number = 0, take: number = 50) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { companyId },
        orderBy: { id: 'desc' },
        skip,
        take,
      }),
      this.prisma.campaign.count({ where: { companyId } }),
    ]);

    return { data, total };
  }
}
