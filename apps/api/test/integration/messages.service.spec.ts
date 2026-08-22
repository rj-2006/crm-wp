import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from '../../src/messages/messages.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WHATSAPP_PROVIDER } from '../../src/whatsapp-adapter/whatsapp-provider.token';
import { mockWhatsAppProvider, resetMockWhatsAppProvider } from '../mocks/mock-whatsapp.provider';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../src/queue/queue.constants';
import { AuditService } from '../../src/audit/audit.service';

describe('MessagesService (Integration)', () => {
  let service: MessagesService;
  let prisma: PrismaService;
  
  // We mock the BullMQ queue so we don't actually try to start Redis jobs during tests
  const mockQueue = { add: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        PrismaService,
        AuditService,
        // Override the real WhatsApp provider with our mock
        { provide: WHATSAPP_PROVIDER, useValue: mockWhatsAppProvider },
        // Override the BullMQ queue with our mock
        { provide: getQueueToken(QUEUE_NAMES.MESSAGE_SEND), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear out our mocks before every test
    resetMockWhatsAppProvider();
    mockQueue.add.mockClear();
    
    // Delete child tables first to satisfy foreign key constraints
    await prisma.activityLog.deleteMany();
    await prisma.message.deleteMany();
    await prisma.messageTemplate.deleteMany();
    await prisma.whatsAppAccount.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  describe('sendOne', () => {
    it('should throw an error if WhatsApp account is not active', async () => {
      // 1. Arrange: Create our test data
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const contact = await prisma.contact.create({
        data: { companyId: company.id, phone: '+1234567890', consentStatus: 'OPTED_IN' },
      });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'hello_world', approvalStatus: 'APPROVED' },
      });
      
      // Crucial part: an INACTIVE WhatsApp account
      await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '123', active: false },
      });
      const user = await prisma.user.create({
        data: { companyId: company.id, name: 'Test', email: 't1@example.com', passwordHash: 'hash' },
      });

      // 2. Act & Assert
      await expect(
        service.sendOne(company.id, user.id, {
          contactId: contact.id,
          templateName: template.name,
          bodyParams: ['John'],
        })
      ).rejects.toThrow('No active WhatsApp account configured');

      // Ensure no queue job was added
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should create a message and queue a job if all conditions are met', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const contact = await prisma.contact.create({
        data: { companyId: company.id, phone: '+1987654321', consentStatus: 'OPTED_IN' },
      });
      const template = await prisma.messageTemplate.create({
        data: { companyId: company.id, name: 'welcome', language: 'en', approvalStatus: 'APPROVED', structurePayload: { body: 'Hello {{1}}' } as any },
      });
      
      // ACTIVE WhatsApp account
      await prisma.whatsAppAccount.create({
        data: { companyId: company.id, phoneNumberId: '456', active: true },
      });
      const user = await prisma.user.create({
        data: { companyId: company.id, name: 'Test', email: 't2@example.com', passwordHash: 'hash' },
      });

      // 2. Act
      const message = await service.sendOne(company.id, user.id, {
        contactId: contact.id,
        templateName: template.name,
        bodyParams: ['Alice'],
      });

      // 3. Assert
      expect(message).toBeDefined();
      expect(message.status).toBe('QUEUED');
      expect(message.body).toBe('Hello Alice');

      // Verify the job was pushed to BullMQ with the correct payload
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        {
          messageId: message.id,
          to: '+1987654321',
          templateName: 'welcome',
          language: 'en',
          bodyParams: ['Alice'],
        },
        expect.any(Object),
      );
    });
  });
});
