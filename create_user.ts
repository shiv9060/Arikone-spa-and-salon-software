import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  // Find the first tenant (usually the demo tenant)
  const tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.error('No tenant found. Run prisma db seed first.');
    return;
  }

  const email = 'shivamkumar4702@gmail.com';
  const plainPassword = '2603';
  
  console.log(`Creating user ${email}...`);
  const passwordHash = await argon2.hash(plainPassword);

  const user = await prisma.user.upsert({
    where: { 
      tenantId_email: { 
        tenantId: tenant.id, 
        email 
      } 
    },
    update: {
      passwordHash,
      role: 'OWNER',
    },
    create: {
      tenantId: tenant.id,
      email,
      name: 'Shivam Kumar',
      passwordHash,
      role: 'OWNER',
    }
  });

  console.log('✅ User successfully created/updated!');
  console.log(`Tenant: ${tenant.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
