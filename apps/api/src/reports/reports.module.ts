import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

/**
 * Reports module stub.
 * TODO (Person B — M5): Implement campaign/delivery reporting endpoints here.
 * Aggregation queries run against campaign_recipients + messages tables.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
