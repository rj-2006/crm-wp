import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './processors/webhook.processor';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { WhatsAppAdapterModule } from '../whatsapp-adapter/whatsapp-adapter.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.WEBHOOK_PROCESS }), WhatsAppAdapterModule],
  controllers: [WebhooksController],
  providers: [WebhookProcessor],
})
export class WebhooksModule {}
