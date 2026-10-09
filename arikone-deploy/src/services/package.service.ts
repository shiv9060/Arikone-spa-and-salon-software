import 'server-only';
import prisma from '@/lib/db/prisma';

export async function createPackage(tenantId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const pkg = await tx.package.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price,
        validityDays: data.validityDays,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      }
    });

    if (data.services && data.services.length > 0) {
      const packageServices = data.services.map((s: any) => ({
        tenantId,
        packageId: pkg.id,
        serviceId: s.serviceId,
        quantity: s.quantity
      }));
      await tx.packageService.createMany({ data: packageServices });
    }

    return tx.package.findUnique({
      where: { id: pkg.id },
      include: { packageServices: { include: { service: true } } }
    });
  });
}

export async function getPackages(tenantId: string, filters?: { search?: string, isActive?: boolean }, page = 1, limit = 10) {
  const where: any = { tenantId };
  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [packages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        packageServices: { include: { service: true } },
        _count: {
          select: { customerPackages: { where: { status: 'ACTIVE' } } }
        }
      }
    }),
    prisma.package.count({ where })
  ]);

  return { packages, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPackage(tenantId: string, packageId: string) {
  return prisma.package.findUnique({
    where: { id: packageId, tenantId },
    include: { packageServices: { include: { service: true } } }
  });
}

export async function updatePackage(tenantId: string, packageId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const pkg = await tx.package.update({
      where: { id: packageId, tenantId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        validityDays: data.validityDays,
        isActive: data.isActive,
        updatedBy: data.updatedBy,
      }
    });

    if (data.services) {
      await tx.packageService.deleteMany({ where: { packageId, tenantId } });
      const packageServices = data.services.map((s: any) => ({
        tenantId,
        packageId: pkg.id,
        serviceId: s.serviceId,
        quantity: s.quantity
      }));
      await tx.packageService.createMany({ data: packageServices });
    }

    return pkg;
  });
}

export async function getCustomerPackages(tenantId: string, customerId: string) {
  // Update statuses before returning just to be safe
  await updateExpiredPackages(tenantId, customerId);

  return prisma.customerPackage.findMany({
    where: { tenantId, customerId },
    include: {
      package: {
        include: { packageServices: { include: { service: true } } }
      },
      usages: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getActiveCustomerPackages(tenantId: string, customerId: string) {
  await updateExpiredPackages(tenantId, customerId);

  return prisma.customerPackage.findMany({
    where: { tenantId, customerId, status: 'ACTIVE' },
    include: {
      package: {
        include: { packageServices: { include: { service: true } } }
      },
      usages: true
    },
    orderBy: { expiresAt: 'asc' }
  });
}

export async function updateExpiredPackages(tenantId: string, customerId?: string) {
  const where: any = { tenantId, status: 'ACTIVE', expiresAt: { lt: new Date() } };
  if (customerId) where.customerId = customerId;

  await prisma.customerPackage.updateMany({
    where,
    data: { status: 'EXPIRED' }
  });
}

export async function purchasePackage(tenantId: string, customerId: string, packageId: string, invoiceId?: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId, tenantId }
  });

  if (!pkg) throw new Error('Package not found');

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

  const customerPackage = await prisma.customerPackage.create({
    data: {
      tenantId,
      customerId,
      packageId,
      purchaseInvoiceId: invoiceId,
      purchasedAt,
      expiresAt,
      status: 'ACTIVE'
    }
  });

  if (invoiceId) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'PACKAGE_PURCHASED',
        entityType: 'CustomerPackage',
        entityId: customerPackage.id,
        description: `Purchased package ${pkg.name} via invoice ${invoiceId}`
      }
    });
  }

  return customerPackage;
}

export async function usePackageService(tenantId: string, customerPackageId: string, serviceId: string, quantity: number, invoiceId?: string, appointmentId?: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const custPkg = await tx.customerPackage.findUnique({
      where: { id: customerPackageId, tenantId },
      include: {
        package: { include: { packageServices: true } },
        usages: true
      }
    });

    if (!custPkg) throw new Error('Customer package not found');
    if (custPkg.status !== 'ACTIVE') throw new Error(`Package is ${custPkg.status}`);
    if (custPkg.expiresAt < new Date()) {
      await tx.customerPackage.update({ where: { id: custPkg.id }, data: { status: 'EXPIRED' } });
      throw new Error('Package is expired');
    }

    const pkgService = custPkg.package.packageServices.find(ps => ps.serviceId === serviceId);
    if (!pkgService) throw new Error('Service not included in this package');

    const usedSoFar = custPkg.usages.filter(u => u.serviceId === serviceId).reduce((sum, u) => sum + u.quantityUsed, 0);
    const remaining = pkgService.quantity - usedSoFar;

    if (quantity > remaining) {
      throw new Error(`Insufficient quantity remaining. Available: ${remaining}, Requested: ${quantity}`);
    }

    const usage = await tx.packageUsage.create({
      data: {
        tenantId,
        customerPackageId,
        serviceId,
        quantityUsed: quantity,
        invoiceId,
        appointmentId,
        createdBy: userId
      }
    });

    // Check if fully exhausted
    const allUsagesAfter = [...custPkg.usages, usage];
    let isExhausted = true;
    for (const ps of custPkg.package.packageServices) {
      const uCount = allUsagesAfter.filter(u => u.serviceId === ps.serviceId).reduce((s, u) => s + u.quantityUsed, 0);
      if (uCount < ps.quantity) {
        isExhausted = false;
        break;
      }
    }

    if (isExhausted) {
      await tx.customerPackage.update({
        where: { id: custPkg.id },
        data: { status: 'EXHAUSTED' }
      });
    }

    return usage;
  });
}
