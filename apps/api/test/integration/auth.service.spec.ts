import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../src/audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { cleanDatabase } from './db-cleanup';

describe('AuthService (Integration)', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    // We mock ConfigService to provide a fixed JWT secret
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        UsersService,
        PrismaService,
        AuditService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('login', () => {
    it('should return a valid JWT pair for correct credentials', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Acme' } });
      const passwordHash = await bcrypt.hash('correctPassword123', 10);
      const user = await prisma.user.create({
        data: { companyId: company.id, name: 'Alice', email: 'alice@acme.com', passwordHash },
      });

      // 2. Act
      const result = await service.login('alice@acme.com', 'correctPassword123');

      // 3. Assert
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // 1. Arrange
      const company = await prisma.company.create({ data: { name: 'Acme' } });
      const passwordHash = await bcrypt.hash('correctPassword123', 10);
      await prisma.user.create({
        data: { companyId: company.id, name: 'Alice', email: 'alice@acme.com', passwordHash },
      });

      // 2. Act & Assert
      await expect(
        service.login('alice@acme.com', 'wrongPassword!')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
