import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { TemplateApproval } from '@prisma/client';
import {
  ParsedWebhookEvent,
  PermanentProviderError,
  RemoteTemplate,
  SendTemplateMessageInput,
  SendTemplateMessageResult,
  TransientProviderError,
  WhatsAppProvider,
} from '../whatsapp-provider.interface';


@Injectable()
export class MetaCloudApiProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MetaCloudApiProvider.name);
  private readonly http: AxiosInstance;
  private readonly apiVersion: string;
  private readonly appSecret: string;

  constructor(private config: ConfigService) {
    this.apiVersion = this.config.get<string>('META_GRAPH_API_VERSION', 'v20.0');
    this.appSecret = this.config.get<string>('META_APP_SECRET', '');
    this.http = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: { Authorization: `Bearer ${this.config.get<string>('META_ACCESS_TOKEN', '')}` },
      timeout: 10_000,
    });
  }

  async sendTemplateMessage(input: SendTemplateMessageInput): Promise<SendTemplateMessageResult> {
    const phoneNumberId = this.config.get<string>('META_PHONE_NUMBER_ID');

    try {
      const { data } = await this.http.post(`/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: input.to.replace('+', ''),
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: input.language },
          components: input.bodyParams.length
            ? [{ type: 'body', parameters: input.bodyParams.map((text) => ({ type: 'text', text })) }]
            : undefined,
        },
      });

      const providerMessageId = data?.messages?.[0]?.id;
      if (!providerMessageId) {
        throw new PermanentProviderError('Meta API returned no message id');
      }
      return { providerMessageId };
    } catch (err: any) {
      this.classifyAndRethrow(err);
    }
  }

  async listApprovedTemplates(whatsappAccountId: string): Promise<RemoteTemplate[]> {
    const wabaId = this.config.get<string>('META_WABA_ID');
    try {
      const { data } = await this.http.get(`/${wabaId}/message_templates`, {
        params: { fields: 'name,language,status,id,components' },
      });

      return (data?.data ?? []).map((t: any) => ({
        name: t.name,
        language: t.language,
        status: this.mapApprovalStatus(t.status),
        providerTemplateId: t.id,
        bodyPreview: t.components?.find((c: any) => c.type === 'BODY')?.text ?? '',
      }));
    } catch (err: any) {
      this.classifyAndRethrow(err);
    }
  }


  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader || !this.appSecret) return false;

    const expected =
      'sha256=' + crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  parseWebhookPayload(payload: unknown): ParsedWebhookEvent[] {
    const events: ParsedWebhookEvent[] = [];
    const entries = (payload as any)?.entry ?? [];

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};

        for (const status of value.statuses ?? []) {
          events.push({
            kind: 'status',
            providerMessageId: status.id,
            status: status.status, // 'sent' | 'delivered' | 'read' | 'failed'
            errorMessage: status.errors?.[0]?.title,
            timestamp: new Date(Number(status.timestamp) * 1000),
          });
        }

        for (const message of value.messages ?? []) {
          events.push({
            kind: 'inbound',
            from: `+${message.from}`,
            body: message.text?.body ?? '',
            providerMessageId: message.id,
            timestamp: new Date(Number(message.timestamp) * 1000),
          });
        }
      }
    }

    return events;
  }

  private mapApprovalStatus(status: string): TemplateApproval {
    switch (status) {
      case 'APPROVED':
        return TemplateApproval.APPROVED;
      case 'REJECTED':
        return TemplateApproval.REJECTED;
      default:
        return TemplateApproval.PENDING_REVIEW;
    }
  }


  private classifyAndRethrow(err: any): never {
    const status = err?.response?.status;
    const metaError = err?.response?.data?.error;

    this.logger.warn(`Meta API error: ${status} ${metaError?.message ?? err.message}`);


    if (status === 429 || (status >= 500 && status < 600) || !status) {
      throw new TransientProviderError(metaError?.message ?? err.message);
    }
    throw new PermanentProviderError(metaError?.message ?? err.message);
  }
}
