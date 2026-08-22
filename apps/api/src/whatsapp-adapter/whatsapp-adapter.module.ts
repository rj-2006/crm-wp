import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.token';
import { MetaCloudApiProvider } from './providers/meta-cloud-api.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    MetaCloudApiProvider,
    { provide: WHATSAPP_PROVIDER, useClass: MetaCloudApiProvider },
  ],
  exports: [WHATSAPP_PROVIDER],
})
export class WhatsAppAdapterModule {}
