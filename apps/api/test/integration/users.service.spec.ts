import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from '../../src/messages/messages.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WHATSAPP_PROVIDER } from '../../src/whatsapp-adapter/whatsapp-provider.token';
import {
  mockWhatsAppProvider,
  resetMockWhatsAppProvider,
} from '../mocks/mock-whatsapp.provider';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../src/queue/queue.constants';

describe('MessagesService (Integration)', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  // mock the BullMQ queue so it doesn't actually try to start Redis jobs during tests
  const mockQueue = { add: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        PrismaService,
        // Override the real WhatsApp provider with our mock
        { provide: WHATSAPP_PROVIDER, useValue: mockWhatsAppProvider },
        // Override the BullMQ queue with our mock
        {
          provide: getQueueToken(QUEUE_NAMES.MESSAGE_SEND),
          useValue: mockQueue,
        },
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

    // Clear out the database tables we will be touching to ensure a clean slate
    await prisma.message.deleteMany();
    await prisma.messageTemplate.deleteMany();
    await prisma.whatsAppAccount.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.company.deleteMany();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
