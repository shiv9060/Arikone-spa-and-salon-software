import 'server-only';
import prisma from '@/lib/db/prisma';

export type ArikoneFeature = 
  | 'CRM'
  | 'APPOINTMENTS'
  | 'BILLING'
  | 'REPORTS'
  | 'WHATSAPP'
  | 'CAMPAIGNS'
  | 'MEMBERSHIPS'
  | 'LOYALTY'
  | 'PACKAGES'
  | 'INVENTORY'
  | 'EXPENSES'
  | 'PROFIT_LOSS'
  | 'FEEDBACK'
  | 'EXPORTS';

export async function hasFeatureAccess(tenantId: string, feature: ArikoneFeature): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  if (!tenant) return false;
  
  if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
    return false; // Suspended/Cancelled tenants lose feature access
  }

  // If no plan is assigned, we assume they have access to core features or none depending on business rules.
  // For Arikone, let's assume they have access to nothing or basic features if no plan.
  if (!tenant.plan) {
    // Hardcode fallback for basic access if needed, or deny all.
    const basicFeatures: ArikoneFeature[] = ['CRM', 'APPOINTMENTS', 'BILLING'];
    return basicFeatures.includes(feature);
  }

  const features = tenant.plan.features as Record<string, boolean> | null;
  if (!features) return false;

  return features[feature] === true;
}

export async function getTenantLimit(tenantId: string, limitKey: 'USERS' | 'CUSTOMERS' | 'STAFF'): Promise<number | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  if (!tenant || !tenant.plan || !tenant.plan.limits) return null;

  const limits = tenant.plan.limits as Record<string, number>;
  return limits[limitKey] ?? null;
}
