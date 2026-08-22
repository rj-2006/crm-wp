import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CampaignsService, CreateCampaignDto } from './campaigns.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CrmUserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/:companyId/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Roles(CrmUserRole.ADMIN)
  @Post()
  async create(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Body() dto: CreateCampaignDto,
  ) {
    console.log('Incoming DTO in controller:', dto);
    return this.campaignsService.create(companyId, req.user.sub, dto);
  }

  @Roles(CrmUserRole.ADMIN)
  @Post(':campaignId/execute')
  async execute(
    @Param('companyId') companyId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.execute(companyId, campaignId);
  }

  @Roles(CrmUserRole.ADMIN, CrmUserRole.STAFF)
  @Get()
  async findAll(
    @Param('companyId') companyId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.campaignsService.findAll(companyId, skip ? parseInt(skip) : 0, take ? parseInt(take) : 50);
  }

  @Roles(CrmUserRole.ADMIN, CrmUserRole.STAFF)
  @Get(':campaignId')
  async findOne(
    @Param('companyId') companyId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.findOne(companyId, campaignId);
  }
}
