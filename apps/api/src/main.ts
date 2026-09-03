import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix
  app.setGlobalPrefix('api');

  // 2. CORS configuration for frontend
  app.enableCors({
    origin: [
      'https://web-production-ea2855.up.railway.app',
      'http://localhost:3000',
      'http://localhost:3001',
      /\.up\.railway\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
