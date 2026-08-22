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
      const existing = await this.prisma.messageTemplate.findFirst({
        where: { companyId, name: t.name },
      });

      if (existing) {
        await this.prisma.messageTemplate.update({
          where: { id: existing.id },
          data: {
            approvalStatus: t.status,
            providerTemplateId: t.providerTemplateId,
            language: t.language,
            structurePayload: { body: t.bodyPreview } as any,
          },
        });
      } else {
        await this.prisma.messageTemplate.create({
          data: {
            companyId,
            name: t.name,
            language: t.language,
            approvalStatus: t.status,
            providerTemplateId: t.providerTemplateId,
            structurePayload: { body: t.bodyPreview } as any,
          },
        });
      }
      updated++;
    }

    this.logger.log(`Synced ${updated} templates for company ${companyId}`);
    return { synced: updated };
  }
}
