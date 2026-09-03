import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  const companyId = randomUUID();

  // 1. Create a Company
  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Acme Corp',
    },
  });
  console.log(`Created company with id: ${company.id}`);

  // 2. Create an Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
    create: {
      companyId: company.id,
      name: 'Admin User',
      email: 'admin@acme.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
