import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedBankAccounts(user1, user2, user3) {
  console.log("Seeding Bank Accounts...");
  await prisma.bankAccount.upsert({
    where: { number: "111222333" },
    update: {},
    create: {
      idUser: user1.id,
      name: "Rekening Mas Azhar",
      bankName: "BCA",
      number: "111222333"
    }
  });
    await prisma.bankAccount.upsert({
    where: { number: "112233445" },
    update: {},
    create: {
      idUser: user1.id,
      name: "Rekening Mas Azhar",
      bankName: "BSI",
      number: "112233445"
    }
  });
  await prisma.bankAccount.upsert({
    where: { number: "444555666" },
    update: {},
    create: {
      idUser: user2.id,
      name: "Rekening Mas Bagus",
      bankName: "BRI",
      number: "444555666"
    }
  });
    await prisma.bankAccount.upsert({
    where: { number: "77889954" },
    update: {},
    create: {
      idUser: user3.id,
      name: "Rekening Teh Desi",
      bankName: "BJB",
      number: "77889954"
    }
  });
}
