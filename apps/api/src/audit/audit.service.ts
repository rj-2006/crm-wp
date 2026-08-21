import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditEntry {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}

interface ActivityEntry {
  companyId: string;
  contactId?: string;
  userId?: string;
  action: string;
}


@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(entry: AuditEntry) {
    return this.prisma.auditLog.create({ data: entry });
  }

  activity(entry: ActivityEntry) {
    return this.prisma.activityLog.create({ data: entry });
  }
}
