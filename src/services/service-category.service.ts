import 'server-only';
import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';

export async function getCategories(tenantId: string) {
  return prisma.serviceCategory.findMany({
    where: { tenantId },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { services: true }
      }
    }
  });
}

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export async function createCategory(tenantId: string, userId: string, data: CreateCategoryInput) {
  // Check for uniqueness within tenant
  const existing = await prisma.serviceCategory.findUnique({
    where: { tenantId_name: { tenantId, name: data.name } }
  });

  if (existing) throw new Error('Category name already exists in your business');

  const category = await prisma.serviceCategory.create({
    data: { ...data, tenantId },
  });

  await logAudit(tenantId, userId, 'CATEGORY_CREATED', 'ServiceCategory', category.id, `Category created: ${category.name}`);
  return category;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export async function updateCategory(tenantId: string, userId: string, categoryId: string, data: UpdateCategoryInput) {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id: categoryId, tenantId },
  });

  if (!existing) throw new Error('Category not found');

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.serviceCategory.findUnique({
      where: { tenantId_name: { tenantId, name: data.name } }
    });
    if (duplicate) throw new Error('Category name already exists in your business');
  }

  const category = await prisma.serviceCategory.update({
    where: { id: categoryId, tenantId },
    data,
  });

  await logAudit(tenantId, userId, 'CATEGORY_UPDATED', 'ServiceCategory', category.id, `Category updated: ${category.name}`);
  return category;
}

export async function deactivateCategory(tenantId: string, userId: string, categoryId: string) {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id: categoryId, tenantId },
  });

  if (!existing) throw new Error('Category not found');

  const category = await prisma.serviceCategory.update({
    where: { id: categoryId, tenantId },
    data: { isActive: false },
  });

  await logAudit(tenantId, userId, 'CATEGORY_DEACTIVATED', 'ServiceCategory', category.id, `Category deactivated: ${category.name}`);
  return category;
}
