import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmMessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsAppService {
  constructor(private db: PrismaService) {}

  accounts(companyId: string) {
    return this.db.whatsAppAccount.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        phoneNumberId: true,
        businessAccountId: true,
        active: true,
        createdAt: true,
      },
    });
  }

  createAccount(companyId: string, b: any) {
    return this.db.whatsAppAccount.create({
      data: {
        companyId,
        name: b.name,
        phoneNumberId: b.phoneNumberId,
        businessAccountId: b.businessAccountId,
        accessToken: b.accessToken,
      },
    });
  }

  async send(companyId: string, b: any) {
    const account = await this.db.whatsAppAccount.findFirst({
      where: { id: b.whatsappAccountId, companyId, active: true },
    });
    if (!account) throw new NotFoundException('WhatsApp account not found');

    const contact = await this.db.contact.findFirst({
      where: { id: b.contactId, companyId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    // Consent gate — reject if latest log is an opt-out
    const latestConsent = await this.db.consentLog.findFirst({
      where: { companyId, contactId: contact.id },
      orderBy: { capturedAt: 'desc' },
    });
    if (latestConsent?.type === 'OPT_OUT') {
      throw new Error('Contact has opted out');
    }

    const msg = await this.db.message.create({
      data: {
        companyId,
        contactId: contact.id,
        whatsappAccountId: account.id,
        direction: 'OUTBOUND',
        status: 'QUEUED',
        messageType: 'text',
        body: b.body,
      },
    });

    try {
      let providerId = 'mock-' + msg.id;

      if (account.accessToken && process.env.META_PHONE_NUMBER_ID) {
        const version = process.env.META_GRAPH_VERSION || 'v23.0';
        const res = await fetch(
          `https://graph.facebook.com/${version}/${account.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: contact.phone,
              type: 'text',
              text: { body: b.body },
            }),
          },
        );
        const data: any = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Meta API error');
        providerId = data.messages?.[0]?.id || providerId;
      }

      await this.db.message.update({
        where: { id: msg.id },
        data: { status: 'SENT', providerMessageId: providerId, sentAt: new Date() },
      });
      return this.db.message.findUnique({ where: { id: msg.id } });
    } catch (e: any) {
      return this.db.message.update({
        where: { id: msg.id },
        data: { status: 'FAILED', errorMessage: e.message },
      });
    }
  }

  history(companyId: string, contactId: string) {
    return this.db.message.findMany({
      where: { companyId, contactId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async webhook(_query: any, body: any) {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const phoneId: string | undefined = value?.metadata?.phone_number_id;

    const account = phoneId
      ? await this.db.whatsAppAccount.findUnique({ where: { phoneNumberId: phoneId } })
      : null;

    // companyId on WhatsAppAccount is String? — coerce null → undefined for Prisma
    const event = await this.db.webhookEvent.create({
      data: {
        companyId: account?.companyId ?? undefined,
        whatsappAccountId: account?.id ?? undefined,
        eventType: change?.field || 'unknown',
        payload: body,
      },
    });

    // Process inbound messages
    for (const m of value?.messages || []) {
      const phone: string = m.from;
      const contact =
        account && account.companyId
          ? await this.db.contact.findUnique({
              where: { companyId_phone: { companyId: account.companyId, phone } },
            })
          : null;

      if (contact && account && account.companyId) {
        await this.db.message.create({
          data: {
            companyId: account.companyId,
            contactId: contact.id,
            whatsappAccountId: account.id,
            direction: 'INBOUND',
            status: 'DELIVERED',
            providerMessageId: m.id,
            messageType: m.type,
            body: m.text?.body,
            payload: m,
          },
        });
      }
    }

    // Process status updates
    const statusMap: Record<string, string> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };

    for (const s of value?.statuses || []) {
      const existing = await this.db.message.findFirst({
        where: { providerMessageId: s.id, whatsappAccountId: account?.id ?? undefined },
      });
      if (existing) {
        await this.db.message.update({
          where: { id: existing.id },
          data: {
            status: (statusMap[s.status] || existing.status) as CrmMessageStatus,
            ...(s.status === 'delivered' ? { deliveredAt: new Date() } : {}),
            ...(s.status === 'read' ? { readAt: new Date() } : {}),
          },
        });
      }
    }

    await this.db.webhookEvent.update({
      where: { id: event.id },
      data: { processed: true },
    });

    return { ok: true };
  }
}
