import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WHATSAPP_PROVIDER } from '../whatsapp-adapter/whatsapp-provider.token';
import type { WhatsAppProvider } from '../whatsapp-adapter/whatsapp-provider.interface';
import { Inject } from '@nestjs/common';


@Injectable()
export class TemplatesSyncService {
  private readonly logger = new Logger(TemplatesSyncService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider,
  ) {}

  async syncForCompany(companyId: string, whatsappAccountId: string) {
    const remoteTemplates = await this.provider.listApprovedTemplates(whatsappAccountId);

    let updated = 0;
    for (const t of remoteTemplates) {
      await this.prisma.messageTemplate.upsert({
        where: { companyId_name: { companyId, name: t.name } },
        update: {
          approvalStatus: t.status,
          providerTemplateId: t.providerTemplateId,
          language: t.language,
          bodyPreview: t.bodyPreview,
        },
        create: {
          companyId,
          name: t.name,
          language: t.language,
          approvalStatus: t.status,
          providerTemplateId: t.providerTemplateId,
          bodyPreview: t.bodyPreview,
        },
      });
      updated++;
    }

    this.logger.log(`Synced ${updated} templates for company ${companyId}`);
    return { synced: updated };
  }
}
