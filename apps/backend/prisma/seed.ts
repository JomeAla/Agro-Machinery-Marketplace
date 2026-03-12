import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agromarket.com' },
    update: {},
    create: {
      email: 'admin@agromarket.com',
      password: hashedPassword,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+2348000000000',
      isVerified: true,
    },
  });

  console.log('Admin user created:', admin.email);

  // Create some sample categories
  const categories = [
    { name: 'Tractors', slug: 'tractors', description: 'Agricultural tractors' },
    { name: 'Harvesters', slug: 'harvesters', description: 'Combine harvesters and other harvesting equipment' },
    { name: 'Implements', slug: 'implements', description: 'Farm implements and attachments' },
    { name: 'Spare Parts', slug: 'spare-parts', description: 'Genuine spare parts for machinery' },
  ];

  for (const cat of categories) {
    await prisma.categoryModel.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('Categories created');
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
