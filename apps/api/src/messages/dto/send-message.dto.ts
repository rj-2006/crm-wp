import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  contactId: string;

  @IsString()
  templateName: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyParams?: string[];
}
