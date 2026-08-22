import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { CrmUserRole } from '@prisma/client';
import { cleanDatabase } from './db-cleanup';

describe('UsersService (Integration)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService, AuditService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('create', () => {
    it('should create a new user (with hashed password) and log an auditLog', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Acme Corp' } });
      const admin = await prisma.user.create({
        data: { companyId: company.id, name: 'Admin', email: 'admin@acme.com', passwordHash: 'hash', role: CrmUserRole.ADMIN },
      });

      // 2. Act
      const result = await service.create(company.id, admin.id, {
        name: 'New Staff',
        email: 'staff@acme.com',
        password: 'password123',
        role: CrmUserRole.STAFF,
      });

      // 3. Assert
      expect(result.id).toBeDefined();
      expect(result.email).toBe('staff@acme.com');
      
      // Check that the user is actually in the DB with a hashed password, NOT plain text
      const dbUser = await prisma.user.findUnique({ where: { id: result.id } });
      expect(dbUser?.passwordHash).not.toBe('password123'); // It should be hashed by bcrypt

      // Check the Audit Log
      const auditLogs = await prisma.auditLog.findMany({ where: { entityId: result.id } });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('user.invited');
      expect(auditLogs[0].userId).toBe(admin.id);
    });
  });

  describe('update', () => {
    it('should update a user role and log the change', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Acme Corp' } });
      const admin = await prisma.user.create({
        data: { companyId: company.id, name: 'Admin', email: 'admin@acme.com', passwordHash: 'hash', role: CrmUserRole.ADMIN },
      });
      const staff = await prisma.user.create({
        data: { companyId: company.id, name: 'Staff', email: 'staff@acme.com', passwordHash: 'hash', role: CrmUserRole.STAFF },
      });

      // 2. Act
      const result = await service.update(company.id, admin.id, staff.id, { role: CrmUserRole.ADMIN });

      // 3. Assert
      expect(result.role).toBe(CrmUserRole.ADMIN);

      // Check Audit Log
      const auditLogs = await prisma.auditLog.findMany({ where: { entityId: staff.id, action: 'user.updated' } });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].userId).toBe(admin.id);
      expect((auditLogs[0].changes as any).role).toBe(CrmUserRole.ADMIN);
    });
  });
});
