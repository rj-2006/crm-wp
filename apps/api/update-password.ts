import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    where: { email: 'admin@test.com' },
    data: { passwordHash }
  });
  console.log('Updated admin@test.com password to password123');
}

main().finally(() => prisma.$disconnect());
