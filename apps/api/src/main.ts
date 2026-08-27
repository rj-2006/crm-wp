import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allowed origins list
  const allowedOrigins = [
    'https://web-production-ea2855.up.railway.app',
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as (string | RegExp)[];

  // Also allow any dynamic Railway staging domain
  allowedOrigins.push(/https:\/\/.*\.up\.railway\.app$/);

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
