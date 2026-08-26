import { Body, Controller, Get, Post, Query, Req, Param } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private s: WhatsAppService) {}

  @Public()
  @Get('webhook')
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'change-me')) return challenge;
    return 'forbidden';
  }

  @Public()
  @Post('webhook')
  webhook(@Body() b: any) {
    return this.s.webhook({}, b);
  }

  @Get('accounts')
  accounts(@Req() r: any) {
    return this.s.accounts(r.user.companyId);
  }

  @Post('accounts')
  create(@Req() r: any, @Body() b: any) {
    return this.s.createAccount(r.user.companyId, b);
  }

  @Post('messages')
  send(@Req() r: any, @Body() b: any) {
    return this.s.send(r.user.companyId, b);
  }

  @Get('messages/:contactId')
  history(@Req() r: any, @Param('contactId') id: string) {
    return this.s.history(r.user.companyId, id);
  }
}
