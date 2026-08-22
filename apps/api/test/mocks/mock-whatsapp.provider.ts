import { WhatsAppProvider } from '../../src/whatsapp-adapter/whatsapp-provider.interface';

export const mockWhatsAppProvider: jest.Mocked<WhatsAppProvider> = {
  sendTemplateMessage: jest.fn(),

  listApprovedTemplates: jest.fn(),

  verifyWebhookSignature: jest.fn(),

  parseWebhookPayload: jest.fn(),
};

export const resetMockWhatsAppProvider = () => {
  mockWhatsAppProvider.sendTemplateMessage.mockClear();
  mockWhatsAppProvider.listApprovedTemplates.mockClear();
  mockWhatsAppProvider.verifyWebhookSignature.mockClear();
  mockWhatsAppProvider.parseWebhookPayload.mockClear();
};
