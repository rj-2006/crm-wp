import { Test, TestingModule } from '@nestjs/testing';
import { WebhookProcessor } from '../../src/webhooks/processors/webhook.processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WHATSAPP_PROVIDER } from '../../src/whatsapp-adapter/whatsapp-provider.token';
import { mockWhatsAppProvider, resetMockWhatsAppProvider } from '../mocks/mock-whatsapp.provider';

describe('WebhookProcessor (Integration)', () => {
  let processor: WebhookProcessor;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessor,
        PrismaService,
        { provide: WHATSAPP_PROVIDER, useValue: mockWhatsAppProvider },
      ],
    }).compile();

    processor = module.get<WebhookProcessor>(WebhookProcessor);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    resetMockWhatsAppProvider();
    
    // Delete child tables first to satisfy foreign key constraints
    await prisma.activityLog.deleteMany();
    await prisma.webhookEvent.deleteMany();
    await prisma.message.deleteMany();
    await prisma.messageTemplate.deleteMany();
    await prisma.campaignRecipient.deleteMany();
    await prisma.whatsAppAccount.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  describe('process (Status Event)', () => {
    it('should process a sent status event and update the message status', async () => {
      // 1. Arrange: Create Company, Contact, WhatsAppAccount, and a QUEUED Message
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const contact = await prisma.contact.create({
        data: { companyId: company.id, phone: '+1234567890', consentStatus: 'OPTED_IN' },
      });
      const whatsappAccount = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: true },
      });
      
      const message = await prisma.message.create({
        data: {
          companyId: company.id,
          contactId: contact.id,
          whatsappAccountId: whatsappAccount.id,
          direction: 'OUTBOUND',
          status: 'QUEUED',
          providerMessageId: 'meta-msg-123',
        },
      });

      // Mock the provider to return a ParsedWebhookEvent (status)
      mockWhatsAppProvider.parseWebhookPayload.mockReturnValue([
        {
          kind: 'status',
          providerMessageId: 'meta-msg-123',
          status: 'sent',
          timestamp: new Date('2026-08-22T10:00:00Z'),
        },
      ]);

      // 2. Act: Call the processor with a fake BullMQ job
      await processor.process({ data: { payload: { some: 'payload' } } } as any);

      // 3. Assert: Check that the message status updated to SENT
      const updatedMessage = await prisma.message.findUnique({ where: { id: message.id } });
      expect(updatedMessage?.status).toBe('SENT');
      expect(updatedMessage?.sentAt).toBeDefined();

      // Ensure a WebhookEvent was created for auditing/deduplication
      const events = await prisma.webhookEvent.findMany({ where: { messageId: message.id } });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('sent');
    });
  });

  describe('process (Inbound Event)', () => {
    it('should process an inbound event, create a message, and update lastInboundAt', async () => {
      // 1. Arrange: Create Company, Contact, and WhatsAppAccount
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const contact = await prisma.contact.create({
        data: { companyId: company.id, phone: '+1987654321', consentStatus: 'OPTED_IN' },
      });
      const whatsappAccount = await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '456', active: true },
      });

      // Mock the provider to return an inbound event
      mockWhatsAppProvider.parseWebhookPayload.mockReturnValue([
        {
          kind: 'inbound',
          from: '+1987654321',
          providerMessageId: 'meta-inbound-456',
          body: 'Hello there!',
          timestamp: new Date('2026-08-22T11:00:00Z'),
        },
      ]);

      // 2. Act
      await processor.process({ data: { payload: { some: 'payload' } } } as any);

      // 3. Assert: A new message should be created
      const inboundMessages = await prisma.message.findMany({
        where: { contactId: contact.id, direction: 'INBOUND' },
      });
      expect(inboundMessages).toHaveLength(1);
      expect(inboundMessages[0].body).toBe('Hello there!');
      expect(inboundMessages[0].status).toBe('DELIVERED');

      // Contact's lastInboundAt should be updated
      const updatedContact = await prisma.contact.findUnique({ where: { id: contact.id } });
      expect(updatedContact?.lastInboundAt?.getTime()).toEqual(new Date('2026-08-22T11:00:00Z').getTime());
    });
  });
});
