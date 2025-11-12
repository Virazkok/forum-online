import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedHirarky(user1, user2, user3) {
  console.log("Seeding Hirarky Configuration...");

  
  const hirarky = await prisma.hirarky.upsert({
    where: { id: "16a1a351-b855-4000-b472-7ff1abffa738" },
    update: {},
    create: {
      id: "16a1a351-b855-4000-b472-7ff1abffa738",
      name: "Approval 2 Level Standard",
      description: "Approval chain: MANAGER, DIRECTOR",
      levels: {
        create: [
          {
            sequence: 1,
            requiredRole: "MANAGER",
            approverId: user3.id
          },
          {
            sequence: 2,
            requiredRole: "DIRECTOR",
            approverId: user1.id
          }
        ]
      }
    },
    include: { levels: true }
  });


  console.log("Hirarky Configuration created");

  await assignHirarkyToUser(user2.id, hirarky.id)
  console.log("Hirarky Configuration assigned to User");

  return { hirarky, user1, user2, user3 };
}


export async function assignHirarkyToUser(userId, hirarkyId) {
  console.log(`Assigning Hirarky ${hirarkyId} to User ${userId}`);
  await prisma.user.update({
    where: { id: userId },
    data: { hirarkyId }
  });
}
