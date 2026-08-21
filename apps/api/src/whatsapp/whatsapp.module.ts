import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { AuthGuard } from '../common/auth.guard';

@Module({
  // AuthGuard is used on select routes (webhook endpoints are public)
  providers: [WhatsAppService, AuthGuard],
  controllers: [WhatsAppController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
