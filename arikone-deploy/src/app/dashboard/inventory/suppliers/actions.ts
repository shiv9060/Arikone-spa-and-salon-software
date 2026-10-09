'use server';

import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  mobile: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function createSupplier(formData: FormData) {
  const session = await requirePermission('SUPPLIERS_MANAGE');

  const data = supplierSchema.parse({
    name: formData.get('name'),
    mobile: formData.get('mobile'),
    email: formData.get('email'),
    address: formData.get('address'),
    gstin: formData.get('gstin'),
    notes: formData.get('notes'),
    isActive: formData.get('isActive') === 'true',
  });

  const supplier = await prisma.supplier.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      address: data.address,
      gstin: data.gstin,
      notes: data.notes,
      isActive: data.isActive,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_SUPPLIER_CREATE', 'Supplier', supplier.id, `Created supplier ${supplier.name}`);
  revalidatePath('/dashboard/inventory/suppliers');
  return { success: true };
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await requirePermission('SUPPLIERS_MANAGE');

  const data = supplierSchema.parse({
    name: formData.get('name'),
    mobile: formData.get('mobile'),
    email: formData.get('email'),
    address: formData.get('address'),
    gstin: formData.get('gstin'),
    notes: formData.get('notes'),
    isActive: formData.get('isActive') === 'true',
  });

  const supplier = await prisma.supplier.update({
    where: { id, tenantId: session.tenantId },
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      address: data.address,
      gstin: data.gstin,
      notes: data.notes,
      isActive: data.isActive,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_SUPPLIER_UPDATE', 'Supplier', supplier.id, `Updated supplier ${supplier.name}`);
  revalidatePath('/dashboard/inventory/suppliers');
  return { success: true };
}
