import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AuthGuard } from '../common/auth.guard';

@Module({
  providers: [TagsService, AuthGuard],
  controllers: [TagsController],
})
export class TagsModule {}
