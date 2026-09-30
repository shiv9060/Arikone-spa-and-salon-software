import prisma from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateOfferInput {
  name: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  minimumBill?: number;
  maximumDiscount?: number;
  couponCode?: string;
  applicableServices: 'ALL' | 'SPECIFIC';
  serviceIds?: string[];
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  usageLimit?: number;
}

export interface UpdateOfferInput extends Partial<CreateOfferInput> {}

export async function getOffers(
  tenantId: string,
  filters: { page?: number; limit?: number; search?: string; status?: string }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { couponCode: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.status) {
    const now = new Date();
    if (filters.status === 'ACTIVE') {
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (filters.status === 'INACTIVE') {
      where.isActive = false;
    } else if (filters.status === 'EXPIRED') {
      where.endDate = { lt: now };
    } else if (filters.status === 'SCHEDULED') {
      where.startDate = { gt: now };
    }
  }

  const [data, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        offerServices: { select: { serviceId: true, service: { select: { name: true } } } },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOfferById(tenantId: string, offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId, tenantId },
    include: {
      offerServices: { select: { serviceId: true, service: { select: { name: true } } } },
    },
  });

  if (!offer) throw new Error('Offer not found');
  return offer;
}

function normalizeCouponCode(code?: string) {
  if (!code) return null;
  return code.trim().toUpperCase();
}

export async function createOffer(tenantId: string, userId: string, data: CreateOfferInput) {
  if (data.startDate > data.endDate) {
    throw new Error('Start date cannot be after end date');
  }

  if (!data.discountPercent && !data.discountAmount) {
    throw new Error('Offer must have either a discount percentage or amount');
  }

  const couponCode = normalizeCouponCode(data.couponCode);

  if (couponCode) {
    const existing = await prisma.offer.findFirst({
      where: { tenantId, couponCode },
    });
    if (existing) {
      throw new Error(`Coupon code ${couponCode} is already in use`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        minimumBill: data.minimumBill,
        maximumDiscount: data.maximumDiscount,
        couponCode,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true,
        applicableServices: data.applicableServices,
        usageLimit: data.usageLimit,
        createdBy: userId,
        updatedBy: userId,
        offerServices:
          data.applicableServices === 'SPECIFIC' && data.serviceIds
            ? {
                create: data.serviceIds.map((id) => ({
                  tenantId,
                  serviceId: id,
                })),
              }
            : undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'OFFER_CREATED',
        entityType: 'Offer',
        entityId: offer.id,
        description: `Created offer: ${offer.name}`,
      },
    });

    return offer;
  });
}

export async function updateOffer(tenantId: string, offerId: string, userId: string, data: UpdateOfferInput) {
  const existingOffer = await getOfferById(tenantId, offerId);

  const startDate = data.startDate ?? existingOffer.startDate;
  const endDate = data.endDate ?? existingOffer.endDate;

  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date');
  }

  const couponCode = data.couponCode !== undefined ? normalizeCouponCode(data.couponCode) : existingOffer.couponCode;

  if (couponCode && couponCode !== existingOffer.couponCode) {
    const duplicate = await prisma.offer.findFirst({
      where: { tenantId, couponCode, id: { not: offerId } },
    });
    if (duplicate) {
      throw new Error(`Coupon code ${couponCode} is already in use`);
    }
  }

  return prisma.$transaction(async (tx) => {
    if (data.applicableServices === 'SPECIFIC' && data.serviceIds) {
      await tx.offerService.deleteMany({
        where: { offerId },
      });
    }

    const offer = await tx.offer.update({
      where: { id: offerId, tenantId },
      data: {
        name: data.name,
        description: data.description,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        minimumBill: data.minimumBill,
        maximumDiscount: data.maximumDiscount,
        couponCode,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        applicableServices: data.applicableServices,
        usageLimit: data.usageLimit,
        updatedBy: userId,
        offerServices:
          data.applicableServices === 'SPECIFIC' && data.serviceIds
            ? {
                create: data.serviceIds.map((id) => ({
                  tenantId,
                  serviceId: id,
                })),
              }
            : undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'OFFER_UPDATED',
        entityType: 'Offer',
        entityId: offer.id,
        description: `Updated offer: ${offer.name}`,
      },
    });

    return offer;
  });
}

export async function deleteOffer(tenantId: string, offerId: string, userId: string) {
  const offer = await getOfferById(tenantId, offerId);

  if (offer.usageCount > 0) {
    throw new Error('Cannot delete an offer that has already been used. Please deactivate it instead.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.offer.delete({
      where: { id: offerId, tenantId },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'OFFER_DELETED',
        entityType: 'Offer',
        entityId: offerId,
        description: `Deleted offer: ${offer.name}`,
      },
    });
  });
}

export interface ValidateOfferInput {
  couponCode?: string;
  offerId?: string;
  subtotal: number;
  items: { serviceId: string; totalBeforeDiscount: number }[];
}

export interface ValidateOfferResult {
  valid: boolean;
  discountAmount: number;
  offerId?: string;
  message?: string;
  offer?: any;
}

export async function validateOfferForInvoice(
  tenantId: string,
  data: ValidateOfferInput
): Promise<ValidateOfferResult> {
  const { couponCode, offerId, subtotal, items } = data;

  if (!couponCode && !offerId) {
    return { valid: false, discountAmount: 0, message: 'No offer or coupon provided' };
  }

  const whereClause: any = { tenantId };
  if (couponCode) {
    whereClause.couponCode = normalizeCouponCode(couponCode);
  } else if (offerId) {
    whereClause.id = offerId;
  }

  const offer = await prisma.offer.findFirst({
    where: whereClause,
    include: {
      offerServices: true,
    },
  });

  if (!offer) {
    return { valid: false, discountAmount: 0, message: 'Offer not found or invalid coupon code' };
  }

  if (!offer.isActive) {
    return { valid: false, discountAmount: 0, message: 'This offer is not active' };
  }

  const now = new Date();
  if (now < offer.startDate) {
    return { valid: false, discountAmount: 0, message: 'This offer has not started yet' };
  }
  if (now > offer.endDate) {
    return { valid: false, discountAmount: 0, message: 'This offer has expired' };
  }

  if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
    return { valid: false, discountAmount: 0, message: 'This offer has reached its usage limit' };
  }

  if (offer.minimumBill && new Decimal(subtotal).lt(offer.minimumBill)) {
    return { valid: false, discountAmount: 0, message: `Minimum bill amount of ₹${offer.minimumBill} is required` };
  }

  let eligibleAmount = new Decimal(subtotal);

  if (offer.applicableServices === 'SPECIFIC') {
    const applicableServiceIds = new Set(offer.offerServices.map((os) => os.serviceId));
    let calculatedEligibleAmount = new Decimal(0);
    for (const item of items) {
      if (applicableServiceIds.has(item.serviceId)) {
        calculatedEligibleAmount = calculatedEligibleAmount.add(item.totalBeforeDiscount);
      }
    }
    
    if (calculatedEligibleAmount.isZero()) {
      return { valid: false, discountAmount: 0, message: 'Offer is not applicable to any of the selected services' };
    }
    eligibleAmount = calculatedEligibleAmount;
  }

  let calculatedDiscount = new Decimal(0);

  if (offer.discountPercent) {
    const percent = new Decimal(offer.discountPercent);
    calculatedDiscount = eligibleAmount.mul(percent).div(100);
  } else if (offer.discountAmount) {
    calculatedDiscount = Decimal.min(new Decimal(offer.discountAmount), eligibleAmount);
  }

  if (offer.maximumDiscount && calculatedDiscount.gt(offer.maximumDiscount)) {
    calculatedDiscount = new Decimal(offer.maximumDiscount);
  }

  return {
    valid: true,
    discountAmount: calculatedDiscount.toNumber(),
    offerId: offer.id,
    offer,
  };
}
