import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmConsentStatus } from '@prisma/client';
@Injectable()
export class ContactsService {
  constructor(private db: PrismaService) {}
  list(companyId: string, q?: string, status?: any) {
    return this.db.contact.findMany({
      where: {
        companyId,
        status,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async create(companyId: string, b: any, userId: string) {
    try {
      return await this.db.$transaction(async (tx) => {
        const c = await tx.contact.create({
          data: {
            companyId,
            firstName: b.firstName,
            lastName: b.lastName,
            phone: b.phone,
            email: b.email,
            status: b.status,
            source: b.source,
            customFields: b.customFields,
          },
        });
        await tx.activityLog.create({
          data: { companyId, contactId: c.id, userId, type: 'CONTACT_CREATED' },
        });
        return c;
      });
    } catch (err: any) {
      // P2002 = Prisma unique constraint violation
      if (err?.code === 'P2002') {
        throw new ConflictException(`A contact with phone ${b.phone} already exists in your account`);
      }
      throw err;
    }
  }
  async update(companyId: string, id: string, b: any, userId: string) {
    const old = await this.db.contact.findFirst({ where: { id, companyId } });
    if (!old) throw new NotFoundException();
    const c = await this.db.contact.update({ where: { id }, data: b });
    await this.db.activityLog.create({
      data: {
        companyId,
        contactId: id,
        userId,
        type: 'CONTACT_UPDATED',
        metadata: b,
      },
    });
    return c;
  }
  async consent(
    companyId: string,
    id: string,
    type: CrmConsentStatus,
    source?: string,
  ) {
    const c = await this.db.contact.findFirst({ where: { id, companyId } });
    if (!c) throw new NotFoundException();
    return this.db.consentLog.create({
      data: { companyId, contactId: id, type: type.toLowerCase(), source },
    });
  }
  async addTag(companyId: string, id: string, tagId: string) {
    const c = await this.db.contact.findFirst({ where: { id, companyId } });
    if (!c) throw new NotFoundException();
    const t = await this.db.tag.findFirst({ where: { id: tagId, companyId } });
    if (!t) throw new NotFoundException();
    return this.db.contactTag.upsert({
      where: { contactId_tagId: { contactId: id, tagId } },
      create: { contactId: id, tagId },
      update: {},
    });
  }

  async importFromCsv(
    companyId: string,
    userId: string,
    fileBuffer: Buffer,
  ): Promise<{
    imported: number;
    merged: number;
    skipped: number;
    conflicts: { row: number; name: string; phone: string; reason: string }[];
  }> {
    const { parse } = await import('csv-parse/sync');

    let rows: string[][];
    try {
      // Parse the CSV — columns: S.N, Name, Contact, Address (+ optional trailing empty)
      rows = parse(fileBuffer, {
        skip_empty_lines: true,
        relax_column_count: true,
        from_line: 2, // skip the header row
        encoding: 'utf8',
      });
    } catch (err: any) {
      throw new BadRequestException('Failed to parse CSV file. Ensure it is a valid CSV with UTF-8 encoding.');
    }

    let imported = 0;
    let merged = 0;
    let skipped = 0;
    const conflicts: {
      row: number;
      name: string;
      phone: string;
      reason: string;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-indexed, +1 for header
      const [, rawName, rawPhone, rawAddress] = rows[i];

      const name = rawName?.trim();
      const address = rawAddress?.trim() || undefined;

      // --- Normalise phone to E.164 ---
      let phone = rawPhone?.trim().replace(/[\s\-().]/g, '');
      if (!phone) {
        conflicts.push({
          row: rowNum,
          name: name ?? '',
          phone: '',
          reason: 'Missing phone number',
        });
        skipped++;
        continue;
      }

      // Strip known country code prefixes first
      phone = phone.replace(/^(\+91|0091)/, '');

      // Handle 11-digit numbers that still start with 0 (STD landlines like 05222236000)
      // Strip the leading 0 — the +91 will be re-added below
      if (/^0\d{6,10}$/.test(phone)) {
        phone = phone.replace(/^0/, '');
      }

      // Strip a bare 91 prefix only if the result is a valid-length number
      if (/^91\d{10}$/.test(phone)) {
        phone = phone.replace(/^91/, '');
      }

      // Accept 7–11 digit numbers (covers mobiles, landlines, shortcodes)
      if (!/^\d{7,11}$/.test(phone)) {
        conflicts.push({
          row: rowNum,
          name: name ?? '',
          phone: rawPhone,
          reason: 'Invalid phone number format',
        });
        skipped++;
        continue;
      }
      phone = `+91${phone}`;

      // --- Check for existing contact with same phone in this company ---
      const existing = await this.db.contact.findFirst({
        where: { companyId, phone },
      });

      if (existing) {
        // Merge: append new address into customFields if it's different
        const existingFields =
          (existing.customFields as Record<string, any>) ?? {};
        const existingAddresses: string[] =
          existingFields.addresses ??
          (existingFields.address ? [existingFields.address] : []);

        if (address && !existingAddresses.includes(address)) {
          existingAddresses.push(address);
          await this.db.contact.update({
            where: { id: existing.id },
            data: {
              customFields: { ...existingFields, addresses: existingAddresses },
            },
          });
          conflicts.push({
            row: rowNum,
            name: name ?? '',
            phone,
            reason: `Merged address into existing contact "${existing.firstName}"`,
          });
          merged++;
        } else {
          conflicts.push({
            row: rowNum,
            name: name ?? '',
            phone,
            reason: `Exact duplicate of existing contact "${existing.firstName}" — skipped`,
          });
          skipped++;
        }
        continue;
      }

      // --- Create new contact ---
      try {
        await this.db.$transaction(async (tx) => {
          const c = await tx.contact.create({
            data: {
              companyId,
              firstName: name,
              phone,
              source: 'csv_import',
              customFields: address ? { addresses: [address] } : undefined,
            },
          });
          await tx.activityLog.create({
            data: {
              companyId,
              contactId: c.id,
              userId,
              type: 'CONTACT_CREATED',
            },
          });
        });
        imported++;
      } catch (err: any) {
        conflicts.push({
          row: rowNum,
          name: name ?? '',
          phone,
          reason: `DB error: ${err.message}`,
        });
        skipped++;
      }
    }

    return { imported, merged, skipped, conflicts };
  }
}
