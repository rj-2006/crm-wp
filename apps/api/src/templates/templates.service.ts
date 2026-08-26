import { Injectable } from '@nestjs/common';
import { CrmTemplateApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.messageTemplate.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  findApproved(companyId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { companyId, approvalStatus: CrmTemplateApprovalStatus.APPROVED },
    });
  }

  async findOne(companyId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({ where: { id, companyId } });
    if (!template) {
      throw new (require('@nestjs/common').NotFoundException)('Template not found');
    }
    return template;
  }
}
