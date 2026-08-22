import { Body, Controller, Get, Patch, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { AuthGuard } from '../common/auth.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@UseGuards(AuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private s: ContactsService) {}

  @Get()
  list(@Req() r: any, @Query('q') q?: string, @Query('status') status?: any) {
    return this.s.list(r.user.companyId, q, status);
  }

  @Post()
  create(@Req() r: any, @Body() b: CreateContactDto) {
    return this.s.create(r.user.companyId, b, r.user.sub);
  }

  @Patch(':id')
  update(@Req() r: any, @Param('id') id: string, @Body() b: UpdateContactDto) {
    return this.s.update(r.user.companyId, id, b, r.user.sub);
  }

  @Post(':id/consent')
  consent(@Req() r: any, @Param('id') id: string, @Body() b: UpdateConsentDto) {
    return this.s.consent(r.user.companyId, id, b.type, b.source);
  }

  @Post(':id/tags/:tagId')
  tag(@Req() r: any, @Param('id') id: string, @Param('tagId') tagId: string) {
    return this.s.addTag(r.user.companyId, id, tagId);
  }
}
