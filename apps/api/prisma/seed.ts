import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create a Company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corp',
    },
  });
  console.log(`Created company with id: ${company.id}`);

  // 2. Create an Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
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
