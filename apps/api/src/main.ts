import { ValidationPipe } from '@nestjs/common'; import { NestFactory } from '@nestjs/core'; 
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; 
import { AppModule } from './app.module'; 
async function bootstrap() { const app = await NestFactory.create(AppModule); app.setGlobalPrefix('api'); app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })); const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('WhatsApp CRM API').setVersion('1.0').addBearerAuth().build()); SwaggerModule.setup('docs', app, doc); await app.listen(process.env.PORT || 3000) } bootstrap();
