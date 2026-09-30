'use server';

import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function createCategory(formData: FormData) {
  const session = await requirePermission('INVENTORY_CREATE');

  const data = categorySchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    isActive: formData.get('isActive') === 'true',
  });

  const existing = await prisma.productCategory.findUnique({
    where: {
      tenantId_name: {
        tenantId: session.tenantId,
        name: data.name,
      }
    }
  });

  if (existing) {
    throw new Error('Category with this name already exists');
  }

  const category = await prisma.productCategory.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_CATEGORY_CREATE', 'ProductCategory', category.id, `Created product category ${category.name}`);
  revalidatePath('/dashboard/inventory/categories');
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await requirePermission('INVENTORY_UPDATE');

  const data = categorySchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    isActive: formData.get('isActive') === 'true',
  });

  const existing = await prisma.productCategory.findUnique({
    where: {
      tenantId_name: {
        tenantId: session.tenantId,
        name: data.name,
      }
    }
  });

  if (existing && existing.id !== id) {
    throw new Error('Another category with this name already exists');
  }

  const category = await prisma.productCategory.update({
    where: { id, tenantId: session.tenantId },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_CATEGORY_UPDATE', 'ProductCategory', category.id, `Updated product category ${category.name}`);
  revalidatePath('/dashboard/inventory/categories');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await requirePermission('INVENTORY_DELETE');

  const productsCount = await prisma.product.count({
    where: { categoryId: id, tenantId: session.tenantId }
  });

  if (productsCount > 0) {
    throw new Error('Cannot delete category with associated products. Reassign or delete the products first.');
  }

  const category = await prisma.productCategory.delete({
    where: { id, tenantId: session.tenantId }
  });

  await logAudit(session.tenantId, session.userId, 'INVENTORY_CATEGORY_DELETE', 'ProductCategory', id, `Deleted product category ${category.name}`);
  revalidatePath('/dashboard/inventory/categories');
  return { success: true };
}
