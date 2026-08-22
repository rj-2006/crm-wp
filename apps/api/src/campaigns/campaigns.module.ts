import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { CampaignsService } from './campaigns.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.CAMPAIGN_EXECUTE,
    }),
  ],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
