import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedRoles() {
  console.log("Seeding Roles...");
  const roleAdmin = await prisma.roles.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      name: "Admin",
      code: "ADMIN"
    }
  });
  const roleManager = await prisma.roles.upsert({
    where: { code: "MANAGER" },
    update: {},
    create: {
      name: "Manager",
      code: "MANAGER"
    }
  });
  const roleDirector = await prisma.roles.upsert({
    where: { code: "DIRECTOR" },
    update: {},
    create: {
      name: "Director",
      code: "DIRECTOR"
    }
  });
  return { roleAdmin, roleManager, roleDirector };
}
