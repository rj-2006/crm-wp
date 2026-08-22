import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CrmConsentStatus } from '@prisma/client';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaService;

  const mockPrisma = {
    contact: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    consentLog: {
      create: jest.fn(),
    },
    tag: {
      findFirst: jest.fn(),
    },
    contactTag: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact and log the activity', async () => {
      const mockContact = { id: 'contact-1', phone: '+1234567890' };
      mockPrisma.contact.create.mockResolvedValue(mockContact);

      const result = await service.create(
        'company-1',
        { firstName: 'John', phone: '+1234567890' },
        'user-1',
      );

      expect(result).toEqual(mockContact);
      expect(mockPrisma.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'company-1',
          firstName: 'John',
          phone: '+1234567890',
        }),
      });
      expect(mockPrisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          contactId: 'contact-1',
          userId: 'user-1',
          type: 'CONTACT_CREATED',
        },
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if contact does not belong to company', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.update('company-1', 'contact-1', { firstName: 'Jane' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('consent', () => {
    it('should correctly log consent changes', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' });
      mockPrisma.consentLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.consent('company-1', 'contact-1', 'OPT_OUT' as CrmConsentStatus, 'website');

      expect(result).toEqual({ id: 'log-1' });
      expect(mockPrisma.consentLog.create).toHaveBeenCalledWith({
        data: {
          companyId: 'company-1',
          contactId: 'contact-1',
          type: 'opt_out',
          source: 'website',
        },
      });
    });
  });
});
