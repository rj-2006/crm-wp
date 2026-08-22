import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CrmConsentStatus } from '@prisma/client';

export class UpdateConsentDto {
  @IsEnum(CrmConsentStatus)
  type!: CrmConsentStatus;

  @IsString()
  @IsOptional()
  source?: string;
}
