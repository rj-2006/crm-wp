import { TemplateApproval } from '@prisma/client';

export interface SendTemplateMessageInput {
  whatsappAccountId: string;
  to: string; // E.164
  templateName: string;
  language: string;
  bodyParams: string[];
}

export interface SendTemplateMessageResult {
  providerMessageId: string;
}

export interface RemoteTemplate {
  name: string;
  language: string;
  status: TemplateApproval;
  providerTemplateId: string;
  bodyPreview: string;
}

export interface WebhookStatusEvent {
  kind: 'status';
  providerMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  timestamp: Date;
}

export interface WebhookInboundEvent {
  kind: 'inbound';
  from: string; // E.164
  body: string;
  providerMessageId: string;
  timestamp: Date;
}

export type ParsedWebhookEvent = WebhookStatusEvent | WebhookInboundEvent;


export interface WhatsAppProvider {
  sendTemplateMessage(input: SendTemplateMessageInput): Promise<SendTemplateMessageResult>;
  listApprovedTemplates(whatsappAccountId: string): Promise<RemoteTemplate[]>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean;
  parseWebhookPayload(payload: unknown): ParsedWebhookEvent[];
}

export class TransientProviderError extends Error {}
export class PermanentProviderError extends Error {}
