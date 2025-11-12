import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedApprovals(submission1, user1, user3) {
  console.log("Seeding Approvals...");
  const approval1 = await prisma.approval.upsert({
    where: { id: "1dc0995d-597c-4d35-aa33-fa6ee62b19c3" },
    update: {},
    create: {
      id: "1dc0995d-597c-4d35-aa33-fa6ee62b19c3",
      submissionId: submission1.id,
      sequence: 1,
      requiredRole: "MANAGER",
      status: "PENDING",
      approverId: user3.id
    }
  });
  const approval2 = await prisma.approval.upsert({
    where: { id: "4fh0895d-697c-4n30-ah73-fa6ee62b18c3" },
    update: {},
    create: {
      id: "4fh0895d-697c-4n30-ah73-fa6ee62b18c3",
      submissionId: submission1.id,
      sequence: 2,
      requiredRole: "DIRECTOR",
      status: "PENDING",
      approverId: user1.id
    }
  });

  return { approval1, approval2 };
}
