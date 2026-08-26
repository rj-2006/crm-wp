import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Test1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@bharatinfotechs.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@bharatinfotechs.com',
      passwordHash,
      role: 'ADMIN', // check CrmUserRole enum values below
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());