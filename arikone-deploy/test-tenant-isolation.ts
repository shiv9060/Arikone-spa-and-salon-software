import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function runTests() {
  console.log('Starting Tenant Isolation Security Audit...');
  
  // 1. Create Tenant A
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Tenant A',
      slug: 'tenant-a-' + crypto.randomBytes(4).toString('hex'),
      email: 'a@example.com',
      users: {
        create: {
          name: 'Owner A',
          email: 'owner-a-' + crypto.randomBytes(4).toString('hex') + '@example.com',
          passwordHash: 'hash',
          role: 'OWNER'
        }
      }
    }
  });

  // 2. Create Tenant B
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Tenant B',
      slug: 'tenant-b-' + crypto.randomBytes(4).toString('hex'),
      email: 'b@example.com',
      users: {
        create: {
          name: 'Owner B',
          email: 'owner-b-' + crypto.randomBytes(4).toString('hex') + '@example.com',
          passwordHash: 'hash',
          role: 'OWNER'
        }
      }
    }
  });

  // 3. Create entities in Tenant B
  const customerB = await prisma.customer.create({
    data: {
      tenantId: tenantB.id,
      name: 'Customer B',
      email: 'customer-b@example.com',
      mobile: '9999999999'
    }
  });

  const staffB = await prisma.staff.create({
    data: {
      tenantId: tenantB.id,
      name: 'Staff B'
    }
  });

  const serviceCategoryB = await prisma.serviceCategory.create({
    data: {
      tenantId: tenantB.id,
      name: 'Category B'
    }
  });

  // const serviceB = await prisma.service.create({
  //   data: {
  //     tenantId: tenantB.id,
  //     categoryId: serviceCategoryB.id,
  //     name: 'Service B',
  //     price: 100,
  //     duration: 30
  //   }
  // });

  // 4. Test Cross-Tenant Access from Tenant A using the service layer
  let failures = 0;
  
  try {
    const { getCustomer } = await import('./src/services/customer.service');
    await getCustomer(tenantA.id, 'user-a', customerB.id);
    console.error('❌ IDOR Vulnerability: Tenant A can read Customer B');
    failures++;
  } catch (e: any) {
    if (e.message.includes('not found')) {
      console.log('✅ Secured: Tenant A cannot read Customer B');
    } else {
      console.error('❌ Unexpected error reading customer:', e.message);
      failures++;
    }
  }

  try {
    const { updateCustomer } = await import('./src/services/customer.service');
    await updateCustomer(tenantA.id, 'user-a', customerB.id, { name: 'Hacked' });
    console.error('❌ IDOR Vulnerability: Tenant A can update Customer B');
    failures++;
  } catch (e: any) {
    if (e.message.includes('not found')) {
      console.log('✅ Secured: Tenant A cannot update Customer B');
    } else {
      console.error('❌ Unexpected error updating customer:', e.message);
      failures++;
    }
  }

  // Check Staff
  try {
    const { updateStaff } = await import('./src/services/staff.service');
    await updateStaff(tenantA.id, 'user-a', staffB.id, { name: 'Hacked' });
    console.error('❌ IDOR Vulnerability: Tenant A can update Staff B');
    failures++;
  } catch (e: any) {
    if (e.message.includes('not found')) {
      console.log('✅ Secured: Tenant A cannot update Staff B');
    } else {
      console.error('❌ Unexpected error updating staff:', e.message);
      failures++;
    }
  }

  // Clean up
  await prisma.tenant.delete({ where: { id: tenantA.id } });
  await prisma.tenant.delete({ where: { id: tenantB.id } });
  
  if (failures > 0) {
    console.error(`\nTest failed with ${failures} vulnerabilities.`);
    process.exit(1);
  } else {
    console.log('\n✅ All cross-tenant isolation tests passed!');
    process.exit(0);
  }
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
