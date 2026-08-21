import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiBearerAuth()
@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.sendOne(req.user.companyId, req.user.sub, dto);
  }

  @Get('contact/:contactId')
  history(@Req() req: any, @Param('contactId') contactId: string) {
    return this.messagesService.historyForContact(req.user.companyId, contactId);
  }
}
