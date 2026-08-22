import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CrmUserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/:companyId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(CrmUserRole.ADMIN, CrmUserRole.STAFF)
  @Get('global')
  async getGlobalMetrics(@Param('companyId') companyId: string) {
    return this.reportsService.getGlobalMetrics(companyId);
  }

  @Roles(CrmUserRole.ADMIN, CrmUserRole.STAFF)
  @Get('campaigns/:campaignId')
  async getCampaignSummary(
    @Param('companyId') companyId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.reportsService.getCampaignSummary(companyId, campaignId);
  }
}
