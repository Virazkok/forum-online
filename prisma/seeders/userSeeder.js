import { PrismaClient } from '@prisma/client';
import { hash } from '../../src/helpers/bcrypt.helper.js';

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log('Seeding Users...');

  const password = await hash('Admin123'); // compute once

  const user1 = await prisma.users.upsert({
    where: { email: "admin1@example.com" },
    update: {       
    },
    create: {
      fullName: "Admin1",
      email: "admin1@example.com",
      password,
      duration: new Date(),
      status: true,
      is_shadow_banned: false
    }
  });

  return { user1 };
}

seedUsers()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
