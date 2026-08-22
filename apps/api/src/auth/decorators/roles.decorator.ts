import { SetMetadata } from '@nestjs/common';
import { CrmUserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CrmUserRole[]) => SetMetadata(ROLES_KEY, roles);
