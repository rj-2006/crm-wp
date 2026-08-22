import { Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { WHATSAPP_PROVIDER } from '../whatsapp-adapter/whatsapp-provider.token';
import type { WhatsAppProvider } from '../whatsapp-adapter/whatsapp-provider.interface';
import { ConfigService } from '@nestjs/config';


@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WebhooksController {
  constructor(
    @InjectQueue(QUEUE_NAMES.WEBHOOK_PROCESS) private webhookQueue: Queue,
    @Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider,
    private config: ConfigService,
  ) {}


  @Public()
  @Get()
  verify(@Query() query: Record<string, string>, @Res() res: Response) {
    const verifyToken = this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN');
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(HttpStatus.OK).send(challenge);
    }
    return res.status(HttpStatus.FORBIDDEN).send();
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(@Req() req: Request) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer;

    if (!this.provider.verifyWebhookSignature(rawBody, signature)) {
     
      return { status: 'ignored' };
    }

    await this.webhookQueue.add(
      'process',
      { payload: req.body },
      { removeOnComplete: true, removeOnFail: 100 },
    );

    return { status: 'received' };
  }
}
