import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessageSendProcessor } from './processors/message-send.processor';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { WhatsAppAdapterModule } from '../whatsapp-adapter/whatsapp-adapter.module';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.MESSAGE_SEND }), WhatsAppAdapterModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageSendProcessor],
  exports: [MessagesService],
})
export class MessagesModule {}
