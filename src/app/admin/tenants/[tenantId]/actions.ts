'use server';

import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { TenantStatus } from '@prisma/client';

export async function updateTenantStatusAction(tenantId: string, status: string) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const validStatuses: TenantStatus[] = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'];
  if (!validStatuses.includes(status as TenantStatus)) {
    throw new Error('Invalid status');
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: status as TenantStatus }
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.userId,
      action: `TENANT_${status}`,
      entityType: 'Tenant',
      entityId: tenant.id,
    }
  });

  return { success: true };
}
