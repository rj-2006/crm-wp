import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { SegmentQueryDto } from './dto/segment-query.dto';

@Controller('tags')
export class TagsController {
  constructor(private s: TagsService) {}

  @Get()
  list(@Req() r: any) {
    return this.s.list(r.user.companyId);
  }

  @Post()
  create(@Req() r: any, @Body() b: CreateTagDto) {
    return this.s.create(r.user.companyId, b);
  }

  @Post('segment/query')
  segment(@Req() r: any, @Body() b: SegmentQueryDto) {
    return this.s.segment(r.user.companyId, b);
  }
}
