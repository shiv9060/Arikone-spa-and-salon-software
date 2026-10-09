import 'server-only';
import prisma from '@/lib/db/prisma';

export async function getPlatformMetrics() {
  const [
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    totalUsers,
    totalCustomers,
    totalAppointments,
    totalInvoices,
    recentTenants
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count({ where: { status: 'TRIAL' } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count(),
    prisma.customer.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
    prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      }
    })
  ]);

  return {
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    totalUsers,
    totalCustomers,
    totalAppointments,
    totalInvoices,
    recentTenants
  };
}
