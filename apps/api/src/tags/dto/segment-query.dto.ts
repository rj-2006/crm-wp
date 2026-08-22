import { IsOptional, IsString } from 'class-validator';

export class SegmentQueryDto {
  @IsString()
  @IsOptional()
  tagId?: string;
}
