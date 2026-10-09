import 'server-only';
import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';

export async function getServices(tenantId: string, categoryId?: string, activeOnly = false) {
  const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { tenantId };
  if (categoryId) where.categoryId = categoryId;
  if (activeOnly) where.isActive = true;

  return prisma.service.findMany({
    where,
    include: { category: true, productUsages: { include: { product: true } } },
    orderBy: { name: 'asc' },
  });
}

export type CreateServiceInput = {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  price: number;
  durationMinutes: number;
  taxPercent: number;
  isActive: boolean;
};

export async function createService(tenantId: string, userId: string, data: CreateServiceInput) {
  if (data.categoryId) {
    const cat = await prisma.serviceCategory.findUnique({ where: { id: data.categoryId, tenantId } });
    if (!cat) throw new Error('Category not found or does not belong to your business');
    if (!cat.isActive) throw new Error('Cannot assign to an inactive category');
  }

  const service = await prisma.service.create({
    data: { ...data, tenantId },
  });

  await logAudit(tenantId, userId, 'SERVICE_CREATED', 'Service', service.id, `Service created: ${service.name}`);
  return service;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export async function updateService(tenantId: string, userId: string, serviceId: string, data: UpdateServiceInput) {
  const existing = await prisma.service.findUnique({ where: { id: serviceId, tenantId } });
  if (!existing) throw new Error('Service not found');

  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const cat = await prisma.serviceCategory.findUnique({ where: { id: data.categoryId, tenantId } });
    if (!cat) throw new Error('Category not found or does not belong to your business');
    if (!cat.isActive) throw new Error('Cannot assign to an inactive category');
  }

  const service = await prisma.service.update({
    where: { id: serviceId, tenantId },
    data,
  });

  await logAudit(tenantId, userId, 'SERVICE_UPDATED', 'Service', service.id, `Service updated: ${service.name}`);
  return service;
}

export async function deactivateService(tenantId: string, userId: string, serviceId: string) {
  const existing = await prisma.service.findUnique({ where: { id: serviceId, tenantId } });
  if (!existing) throw new Error('Service not found');

  const service = await prisma.service.update({
    where: { id: serviceId, tenantId },
    data: { isActive: false },
  });

  await logAudit(tenantId, userId, 'SERVICE_DEACTIVATED', 'Service', service.id, `Service deactivated: ${service.name}`);
  return service;
}
