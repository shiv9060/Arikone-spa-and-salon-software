'use server';

import { z } from 'zod';
import { requirePermission } from '@/lib/auth/auth-utils';
import { createCategory, updateCategory, deactivateCategory } from '@/services/service-category.service';
import { revalidatePath } from 'next/cache';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true'),
});

export async function createCategoryAction(formData: FormData) {
  const user = await requirePermission('SERVICES_UPDATE'); // Or specific category perm
  
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    sortOrder: formData.get('sortOrder') || '0',
    isActive: formData.get('isActive') || 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createCategory(user.tenantId, user.userId, parsed.data);
    revalidatePath('/dashboard/services/categories');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to create category' };
  }
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const user = await requirePermission('SERVICES_UPDATE');
  
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    sortOrder: formData.get('sortOrder') || '0',
    isActive: formData.get('isActive') || 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await updateCategory(user.tenantId, user.userId, categoryId, parsed.data);
    revalidatePath('/dashboard/services/categories');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to update category' };
  }
}

export async function deactivateCategoryAction(categoryId: string) {
  const user = await requirePermission('SERVICES_UPDATE');
  try {
    await deactivateCategory(user.tenantId, user.userId, categoryId);
    revalidatePath('/dashboard/services/categories');
    return { success: true };
  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: err.message || 'Failed to deactivate category' };
  }
}
