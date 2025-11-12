import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { seedDivisions } from './divisionSeeder.js';
import { seedRoles } from './roleSeeder.js';
import { seedPermissions } from './permissionSeeder.js';
import { seedUsers } from './userSeeder.js';
import { seedBankAccounts } from './bankAccountSeeder.js';
import { seedProjects } from './projectSeeder.js';
import { seedCategorySubmissions } from './categorySubmissionSeeder.js';
import { seedSubmissions } from './submissionSeeder.js';
import { seedApprovals } from './approvalSeeder.js';
import { seedApprovalHistories } from './approvalHistorySeeder.js';
import { seedHirarky } from './hirarkySeeder.js';
import { seedTypes } from './typeSubmissionSeeder.js';

async function main() {
  try {
    console.log('Starting seeding process...');

    const { divisionA, divisionB } = await seedDivisions();
    const roles = await seedRoles();
    await seedPermissions(roles);
    const { user1, user2, user3 } = await seedUsers(
      divisionA,
      divisionB,
      roles
    );
    await seedBankAccounts(user1, user2, user3);
    const { projectLotus } = await seedProjects();
    const category = await seedCategorySubmissions();
    const { F3 } = await seedTypes();
    const { submission1 } = await seedSubmissions(
      user2,
      projectLotus,
      category,
      F3
    );
    const { approval1 } = await seedApprovals(submission1, user1, user3);
    await seedApprovalHistories(approval1, user1);
    await seedHirarky(user1, user2, user3);

    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
