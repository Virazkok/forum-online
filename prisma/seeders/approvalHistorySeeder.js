import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedApprovalHistories(approval1, user1) {
  console.log("Seeding Approval Histories...");
  await prisma.approvalHistory.upsert({
    where: { id: "9ja8345a-597h-4d26-aa84-fa2ee64b79c8" },
    update: {},
    create:  {
      id: "9ja8345a-597h-4d26-aa84-fa2ee64b79c8",
      approvalId: approval1.id,
      actorId: user1.id,
      oldStatus: "PENDING at DIRECTOR",
      newStatus: "APPROVED by DIRECTOR",
      comment: "Just an example, this is not impact to the approval or even the system."
    }
  });
}
