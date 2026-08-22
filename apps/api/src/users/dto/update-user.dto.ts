import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CrmUserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CrmUserRole)
  role?: CrmUserRole;
}
