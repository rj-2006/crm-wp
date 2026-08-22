import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import helmet from 'helmet';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Mirror main.ts configurations
    app.use(helmet());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean DB
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Seed test data
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
      },
    });

    await prisma.user.create({
      data: {
        email: 'test@admin.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'ADMIN',
        name: 'Test Admin',
        companyId: company.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@admin.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 400 for mass assignment attempts (extra fields)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@admin.com', password: 'password123', hack: true })
        .expect(400); // Because of forbidNonWhitelisted: true
    });

    it('should return 200 and a JWT for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@admin.com', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('email', 'test@admin.com');
    });

    it('should trigger rate limiting after 5 requests', async () => {
      // The login endpoint is throttled to 5 requests per 60s.
      // We already made 3 requests above. Let's make 3 more.
      await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrongpassword' }).expect(401);
      await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrongpassword' }).expect(401);
      
      // 6th request overall in this spec
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'x@x.com', password: 'wrongpassword' });
        
      expect(response.status).toBe(429);
    });
  });
});
