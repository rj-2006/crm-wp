import { Injectable } from '@nestjs/common';
import { TemplateApproval } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.messageTemplate.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  findApproved(companyId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { companyId, approvalStatus: TemplateApproval.APPROVED },
    });
  }

  findOne(companyId: string, id: string) {
    return this.prisma.messageTemplate.findFirst({ where: { id, companyId } });
  }
}
