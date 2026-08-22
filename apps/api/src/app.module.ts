import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { TagsModule } from './tags/tags.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { TemplatesModule } from './templates/templates.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuditModule } from './audit/audit.module';
import { WhatsAppAdapterModule } from './whatsapp-adapter/whatsapp-adapter.module';

@Module({
  imports: [
    // Config — loads .env, makes ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Prisma — @Global() module; PrismaService injectable everywhere
    PrismaModule,

    // JWT — global so JwtService is available for AuthGuard without re-importing
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any },
    }),

    // BullMQ — connects to Redis for campaign queue (M4)
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    }),

    // Feature modules
    AuthModule,
    ContactsModule,
    TagsModule,
    WhatsAppModule,
    CampaignsModule, // stub — Person A implements full module in M4
    ReportsModule,   // stub — Person B implements full module in M5
    UsersModule,
    MessagesModule,
    TemplatesModule,
    WebhooksModule,
    AuditModule,
    WhatsAppAdapterModule,
  ],
})
export class AppModule {}
