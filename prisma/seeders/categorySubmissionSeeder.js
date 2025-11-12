import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedCategorySubmissions() {
  console.log("Seeding Category Submissions...");
  const category1 = await prisma.categorySubmission.upsert({
    where: { code: "TRANSPORT" },
    update: {},
    create: {
      name: "Tranportation",
      code: "TRANSPORT"
    }
  });
    const category2 = await prisma.categorySubmission.upsert({
    where: { code: "FOOD_NEEDS" },
    update: {},
    create: {
      name: "Food Needs",
      code: "FOOD_NEEDS"
    }
  });
  return { category1, category2 };
}
