import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { TemplatesService } from './templates.service';
import { TemplatesSyncService } from './templates-sync.service';

@ApiBearerAuth()
@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private templatesService: TemplatesService,
    private syncService: TemplatesSyncService,
  ) {}

  @Get()
  findAll(@Req() req: any) {

    return this.templatesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.templatesService.findOne(req.user.companyId, id);
  }

  @Roles(Role.ADMIN)
  @Post('sync/:whatsappAccountId')
  sync(@Req() req: any, @Param('whatsappAccountId') whatsappAccountId: string) {
    return this.syncService.syncForCompany(req.user.companyId, whatsappAccountId);
  }
}
