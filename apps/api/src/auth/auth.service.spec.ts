import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '123',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });

      await expect(service.login('test@test.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return a token and user details if credentials are correct', async () => {
      const mockUser = {
        id: '123',
        email: 'test@test.com',
        companyId: 'company-1',
        role: 'ADMIN',
        passwordHash: await bcrypt.hash('password123', 10),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login('test@test.com', 'password123');

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@test.com',
          role: 'ADMIN',
          companyId: 'company-1',
        },
      });

      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: '123',
        email: 'test@test.com',
        role: 'ADMIN',
        companyId: 'company-1',
      });
    });
  });
});
