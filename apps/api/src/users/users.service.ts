import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true },
      // No createdAt field on User in schema, so we can't orderBy it. Ordering by id as fallback.
      orderBy: { id: 'desc' },
    });
  }

  async create(companyId: string, actorId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { companyId, name: dto.name, email: dto.email, passwordHash, role: dto.role },
    });

    await this.audit.log({
      companyId,
      userId: actorId,
      entityType: 'User',
      entityId: user.id,
      action: 'user.invited',
      changes: { role: dto.role } as any,
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async update(companyId: string, actorId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      companyId,
      userId: actorId,
      entityType: 'User',
      entityId: id,
      action: 'user.updated',
      changes: dto as any,
    });

    return { id: user.id, name: user.name, role: user.role };
  }
}
