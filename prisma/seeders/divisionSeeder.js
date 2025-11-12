import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedDivisions() {
  console.log("Seeding Divisions...");
  const divisionA = await prisma.division.upsert({
    where: { Code: "DIV-DEV" },
    update: {},
    create: {
      name: "Division Development",
      Code: "DIV-DEV"
    }
  });
  const divisionB = await prisma.division.upsert({
    where: { Code: "DIV-MAR" },
    update: {},
    create: {
      name: "Division Marketing",
      Code: "DIV-MAR"
    }
  });
  return { divisionA, divisionB };
}
