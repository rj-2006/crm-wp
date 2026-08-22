import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CrmUserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConfigService } from './config.service';

class UpdateWhatsAppConfigDto {
  @IsOptional() @IsString() phoneNumberId?: string;
  @IsOptional() @IsString() businessAccountId?: string;
  @IsOptional() @IsString() credentialsRef?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiBearerAuth()
@ApiTags('config')
@Controller('config/whatsapp')
@Roles(CrmUserRole.ADMIN) // Section 21: only Admin may configure the WhatsApp account
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get()
  get(@Req() req: any) {
    return this.configService.getForCompany(req.user.companyId);
  }

  @Patch()
  update(@Req() req: any, @Body() dto: UpdateWhatsAppConfigDto) {
    return this.configService.update(req.user.companyId, req.user.sub, dto);
  }
}
