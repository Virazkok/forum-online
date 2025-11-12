import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedPermissions(roles) {
  console.log('Seeding Permissions...');

        const permission1 = await prisma.permissions.upsert({
        where: { id: "26hfkjsi-28h1-4928-a877-5195245g2na" },
        update: {},
        create: {
          id: "26hfkjsi-28h1-4928-a877-5195245g2na",
          roleId: roles.roleAdmin.id,
          label: "Submission",
          subLabel: "Submission-List",
          read: true,
          create: true,
          update: true,
          delete: true,
          description: "Admin access permission for Submission List"
          }
      });
        const permission2 = await prisma.permissions.upsert({
        where: { id: "26hfkjsi-28h1-4928-a877-5195245g2na" },
        update: {},
        create: {
          id: "26hfkjsi-28h1-4928-a877-5195245g2na",
          roleId: roles.roleAdmin.id,
          label: "Settings",
          subLabel: "User",
          read: true,
          create: true,
          update: true,
          delete: true,
          description: "Admin access permission for User Settings"
          }
      });

  console.log('Permissions seeded successfully');
}
