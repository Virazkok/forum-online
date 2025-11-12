import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedProjects() {
  console.log("Seeding Projects...");
  const projectLotus = await prisma.projectCode.upsert({
    where: { code: "PROJ-LOT" },
    update: {},
    create: {
      name: "Project Museum LOTUS",
      code: "PROJ-LOT",
      description: "Museum LOTUS di TGAA"
    }
  });
  return { projectLotus };
}
