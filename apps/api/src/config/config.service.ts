import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface UpdateWhatsAppConfigInput {
  phoneNumberId?: string;
  businessAccountId?: string;
  credentialsRef?: string; // reference into the secrets manager — never a raw secret
  isActive?: boolean;
}

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async getForCompany(companyId: string) {
    const account = await this.prisma.whatsAppAccount.findFirst({ where: { companyId } });
    if (!account) throw new NotFoundException('No WhatsApp account configured for this company');

    // Mask everything sensitive — the API never returns a usable credential.
    return {
      id: account.id,
      provider: account.provider,
      phoneNumberId: this.mask(account.phoneNumberId),
      businessAccountId: this.mask(account.businessAccountId),
      credentialsRef: account.credentialsRef,
      isActive: account.isActive,
    };
  }

  async update(companyId: string, actorId: string, input: UpdateWhatsAppConfigInput) {
    const account = await this.prisma.whatsAppAccount.findFirst({ where: { companyId } });
    if (!account) throw new NotFoundException('No WhatsApp account configured for this company');

    const updated = await this.prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: input,
    });

    // Section 22: audit log of every configuration change.
    await this.audit.log({
      companyId,
      userId: actorId,
      entityType: 'WhatsAppAccount',
      entityId: account.id,
      action: 'whatsapp_config.updated',
      changes: { ...input, credentialsRef: input.credentialsRef ? '[redacted]' : undefined },
    });

    return this.getForCompany(companyId);
  }

  private mask(value: string): string {
    if (!value || value.length <= 4) return '••••';
    return `••••••••${value.slice(-4)}`;
  }
}
