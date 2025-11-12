import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function seedSubmissions(user2, projectLotus, category, typeF3) {
  console.log("Seeding Submissions...");
  const submission1 = await prisma.submission.upsert({
    where: { number: "F3-2025-1" },
    update: {},
    create: {
      userId: user2.id,
      number: "F3-2025-1",
      typeId: typeF3.id,
      projectId: projectLotus.id,
      date: new Date(),
      activity: "Pre-event preparation",
      description: "Beli dan sewa kebutuhan untuk acara + makan anak-anak panitia",
      status: "DRAFT",
      submissionDetail: {
        create: [
          {
            name: "Parkir",
            qty: 3,
            categoryId: category.category1.id,
            amount: 50000.0,
            evidence: "evidence1_test.jpg"
          },
          {
            name: "Makan Siang",
            qty: 1,
            categoryId: category.category2.id,
            amount: 50000.0,
            evidence: "evidence2_test.png"
          }
        ]
      }
    }
  });
  return { submission1 };
}
