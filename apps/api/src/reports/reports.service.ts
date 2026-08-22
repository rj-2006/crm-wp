import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCampaignSummary(companyId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, companyId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const { totalRecipients, sentCount, deliveredCount, readCount, failedCount } = campaign;

    // Guard against division by zero
    const safeTotal = totalRecipients > 0 ? totalRecipients : 1;

    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      metrics: {
        total: totalRecipients,
        sent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        failed: failedCount,
      },
      rates: {
        deliveryRate: (deliveredCount / safeTotal) * 100,
        readRate: (readCount / safeTotal) * 100,
        failureRate: (failedCount / safeTotal) * 100,
      }
    };
  }

  async getGlobalMetrics(companyId: string) {
    const aggregations = await this.prisma.campaign.aggregate({
      where: { companyId },
      _sum: {
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
      },
      _count: {
        id: true, // total number of campaigns
      }
    });

    const totalRecipients = aggregations._sum.totalRecipients || 0;
    const sentCount = aggregations._sum.sentCount || 0;
    const deliveredCount = aggregations._sum.deliveredCount || 0;
    const readCount = aggregations._sum.readCount || 0;
    const failedCount = aggregations._sum.failedCount || 0;

    const safeTotal = totalRecipients > 0 ? totalRecipients : 1;

    return {
      totalCampaigns: aggregations._count.id,
      metrics: {
        totalRecipients,
        sent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        failed: failedCount,
      },
      rates: {
        globalDeliveryRate: (deliveredCount / safeTotal) * 100,
        globalReadRate: (readCount / safeTotal) * 100,
        globalFailureRate: (failedCount / safeTotal) * 100,
      }
    };
  }
}
