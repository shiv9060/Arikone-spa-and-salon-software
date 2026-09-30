import 'server-only';
import prisma from '@/lib/db/prisma';
import { MembershipStatus, DurationUnit } from '@prisma/client';

export async function createMembershipPlan(tenantId: string, data: any) {
  return prisma.membershipPlan.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
      price: data.price,
      durationValue: data.durationValue,
      durationUnit: data.durationUnit,
      discountPercentage: data.discountPercentage,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
    }
  });
}

export async function getMembershipPlans(tenantId: string, filters?: { search?: string, isActive?: boolean }, page = 1, limit = 10) {
  const where: any = { tenantId };
  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [plans, total] = await Promise.all([
    prisma.membershipPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { customerMemberships: { where: { status: 'ACTIVE' } } }
        }
      }
    }),
    prisma.membershipPlan.count({ where })
  ]);

  return { plans, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMembershipPlan(tenantId: string, planId: string) {
  return prisma.membershipPlan.findUnique({
    where: { id: planId, tenantId }
  });
}

export async function updateMembershipPlan(tenantId: string, planId: string, data: any) {
  return prisma.membershipPlan.update({
    where: { id: planId, tenantId },
    data
  });
}

export async function getCustomerMemberships(tenantId: string, customerId: string) {
  return prisma.customerMembership.findMany({
    where: { tenantId, customerId },
    include: { membershipPlan: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getActiveCustomerMembership(tenantId: string, customerId: string) {
  const now = new Date();
  return prisma.customerMembership.findFirst({
    where: {
      tenantId,
      customerId,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now }
    },
    include: { membershipPlan: true },
    orderBy: { endDate: 'desc' }
  });
}

export async function calculateMembershipEndDate(startDate: Date, durationValue: number, durationUnit: DurationUnit): Promise<Date> {
  const endDate = new Date(startDate);
  if (durationUnit === 'MONTH') {
    endDate.setMonth(endDate.getMonth() + durationValue);
  } else if (durationUnit === 'YEAR') {
    endDate.setFullYear(endDate.getFullYear() + durationValue);
  }
  return endDate;
}

export async function activateMembershipForCustomer(tenantId: string, customerId: string, planId: string, invoiceId?: string) {
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId, tenantId }
  });

  if (!plan) throw new Error('Membership plan not found');
  
  const activeMembership = await getActiveCustomerMembership(tenantId, customerId);
  const startDate = activeMembership ? new Date(activeMembership.endDate) : new Date();
  const endDate = await calculateMembershipEndDate(startDate, plan.durationValue, plan.durationUnit);

  const membership = await prisma.customerMembership.create({
    data: {
      tenantId,
      customerId,
      membershipPlanId: planId,
      startDate,
      endDate,
      status: 'ACTIVE',
      purchaseInvoiceId: invoiceId
    }
  });

  if (invoiceId) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'MEMBERSHIP_PURCHASED',
        entityType: 'CustomerMembership',
        entityId: membership.id,
        description: `Purchased membership ${plan.name} via invoice ${invoiceId}`,
      }
    });
  }

  return membership;
}

export async function cancelCustomerMembership(tenantId: string, membershipId: string, userId?: string) {
  const membership = await prisma.customerMembership.update({
    where: { id: membershipId, tenantId },
    data: { status: 'CANCELLED' }
  });
  
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'MEMBERSHIP_CANCELLED',
      entityType: 'CustomerMembership',
      entityId: membershipId,
    }
  });

  return membership;
}
