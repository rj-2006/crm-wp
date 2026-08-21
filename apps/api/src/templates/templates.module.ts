import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesSyncService } from './templates-sync.service';
import { TemplatesController } from './templates.controller';
import { WhatsAppAdapterModule } from '../whatsapp-adapter/whatsapp-adapter.module';

@Module({
  imports: [WhatsAppAdapterModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesSyncService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
