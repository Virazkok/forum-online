import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedTypes() {
  console.log("Seeding Types...");
  const F3 = await prisma.typeSubmission.upsert({
    where: { code: "F3" },
    update: {},
    create: {
      name: "F3",
      code: "F3",
      description: "Form F3"
    }
  });

  const F4 = await prisma.typeSubmission.upsert({
    where: { code: "F4" },
    update: {},
    create: {
      name: "F4",
      code: "F4",
      description: "Form F4"
    }
  });
 
  const F5 = await prisma.typeSubmission.upsert({
    where: { code: "F5" },
    update: {},
    create: {
      name: "F5",
      code: "F5",
      description: "Form F5"
    }
  });
  
  return { F3 };
}
