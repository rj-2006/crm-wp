import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: 'http://localhost:3001', credentials: true });
  
  // Security headers
  app.use(helmet());

  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      console.error('FATAL ERROR: JWT_SECRET must be set and at least 32 characters long in production');
      process.exit(1);
    }
  }

  // Strict validation
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true, 
  }));

  const doc = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('WhatsApp CRM API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  );
  SwaggerModule.setup('docs', app, doc);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
