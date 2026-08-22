import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { CrmUserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(CrmUserRole)
  @IsOptional()
  role?: CrmUserRole;
}
