import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AuditEntry {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Prisma.JsonObject; // must be Prisma.JsonObject, not Record<string, unknown>
  ipAddress?: string;
}

interface ActivityEntry {
  companyId: string;
  contactId: string;
  userId?: string;
  action: string; // mapped to `type` in Prisma (schema: type String @map("action"))
}


@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(entry: AuditEntry) {
    return this.prisma.auditLog.create({ data: entry });
  }

  activity(entry: ActivityEntry) {
    // Prisma client exposes the column as `type` due to @map("action") in schema
    const { action, ...rest } = entry;
    return this.prisma.activityLog.create({ data: { ...rest, type: action } });
  }
}
