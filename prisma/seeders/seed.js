import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


import { seedUsers } from './userSeeder.js';


async function seedAll() {
  await seedUsers(prisma);

  console.log('✅ Semua seed berhasil.');
}

seedAll()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });