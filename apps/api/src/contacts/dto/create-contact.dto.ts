import { IsString, IsOptional, IsEmail, IsObject, Matches } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format (e.g., +1234567890)' })
  phone!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;
}
