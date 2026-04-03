import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Successfully connected to database!');
    const productCount = await prisma.product.count();
    console.log(`There are ${productCount} products in the database.`);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
