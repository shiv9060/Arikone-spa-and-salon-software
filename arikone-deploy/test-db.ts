import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log('User found:', user?.email);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
