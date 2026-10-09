'use server';

import { z } from 'zod';
import { requirePermission } from '@/lib/auth/auth-utils';
import { createService, updateService, deactivateService } from '@/services/service.service';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  durationMinutes: z.coerce.number().int().min(1, 'Duration must be positive'),
  taxPercent: z.coerce.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100'),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true'),
});

export async function createServiceAction(formData: FormData) {
  const user = await requirePermission('SERVICES_CREATE');
  
  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    categoryId: formData.get('categoryId') || null,
    price: formData.get('price'),
    durationMinutes: formData.get('durationMinutes'),
    taxPercent: formData.get('taxPercent') || '0',
    isActive: formData.get('isActive') || 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const payload = {
    ...parsed.data,
    categoryId: parsed.data.categoryId === '' ? null : parsed.data.categoryId,
  };

  try {
    await createService(user.tenantId, user.userId, payload);
    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to create service' };
  }
}

export async function updateServiceAction(serviceId: string, formData: FormData) {
  const user = await requirePermission('SERVICES_UPDATE');
  
  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    categoryId: formData.get('categoryId') || null,
    price: formData.get('price'),
    durationMinutes: formData.get('durationMinutes'),
    taxPercent: formData.get('taxPercent') || '0',
    isActive: formData.get('isActive') || 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const payload = {
    ...parsed.data,
    categoryId: parsed.data.categoryId === '' ? null : parsed.data.categoryId,
  };

  try {
    await updateService(user.tenantId, user.userId, serviceId, payload);
    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to update service' };
  }
}

export async function deactivateServiceAction(serviceId: string) {
  const user = await requirePermission('SERVICES_UPDATE');
  try {
    await deactivateService(user.tenantId, user.userId, serviceId);
    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to deactivate service' };
  }
}

export async function updateServiceProductUsagesAction(serviceId: string, usages: { productId: string; quantity: number; unit: any }[]) {
  const user = await requirePermission('SERVICES_UPDATE');
  
  try {
    // Basic verification
    const service = await prisma.service.findUnique({ where: { id: serviceId, tenantId: user.tenantId } });
    if (!service) throw new Error('Service not found');

    // Delete existing usages
    await prisma.serviceProductUsage.deleteMany({
      where: { serviceId, tenantId: user.tenantId }
    });

    if (usages.length > 0) {
      await prisma.serviceProductUsage.createMany({
        data: usages.map(u => ({
          tenantId: user.tenantId,
          serviceId,
          productId: u.productId,
          quantity: u.quantity,
          unit: u.unit
        }))
      });
    }

    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update service products' };
  }
}
