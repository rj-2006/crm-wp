import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from '../../src/contacts/contacts.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { ConflictException } from '@nestjs/common';
import { CrmConsentStatus } from '@prisma/client';
import { cleanDatabase } from './db-cleanup';

describe('ContactsService (Integration)', () => {
  let service: ContactsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactsService, PrismaService, AuditService],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('create', () => {
    it('should create a contact and prevent duplicates', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const user = await prisma.user.create({
        data: { companyId: company.id, name: 'User', email: 'u@test.com', passwordHash: 'hash' },
      });

      // 2. Act
      const contact1 = await service.create(company.id, {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      }, user.id);

      // 3. Assert (Creation successful)
      expect(contact1.id).toBeDefined();
      expect(contact1.phone).toBe('+1234567890');

      // 4. Act & Assert (Duplicate prevention)
      await expect(
        service.create(company.id, {
          firstName: 'Jane',
          phone: '+1234567890', // Exact same phone
        }, user.id)
      ).rejects.toThrow();
    });
  });

  describe('updateConsent', () => {
    it('should update consent status and generate a consent log', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Test Corp' } });
      const user = await prisma.user.create({
        data: { companyId: company.id, name: 'User', email: 'u@test.com', passwordHash: 'hash' },
      });
      const contact = await prisma.contact.create({
        data: { companyId: company.id, phone: '+1234567890', consentStatus: CrmConsentStatus.UNKNOWN },
      });

      // 2. Act
      const updatedContact = await service.consent(company.id, contact.id, 'OPT_IN', 'Web Form');

      // 3. Assert
      // We don't get the updated contact back directly, so we assert the consent log was created
      const logs = await prisma.consentLog.findMany({ where: { contactId: contact.id } });
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('opt_in');
      expect(logs[0].source).toBe('Web Form');
    });
  });
});
