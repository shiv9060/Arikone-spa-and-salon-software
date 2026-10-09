'use server';
import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function createExpenseCategory(formData: FormData) {
  const session = await requirePermission('EXPENSES_SETTINGS');

  const data = categorySchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    isActive: formData.get('isActive') === 'true',
  });

  const existing = await prisma.expenseCategory.findUnique({
    where: {
      tenantId_name: {
        tenantId: session.tenantId,
        name: data.name,
      }
    }
  });

  if (existing) {
    throw new Error('Expense category with this name already exists');
  }

  const category = await prisma.expenseCategory.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      createdBy: session.userId,
    }
  });

  await logAudit(session.tenantId, session.userId, 'EXPENSE_CATEGORY_CREATE', 'ExpenseCategory', category.id, `Created expense category ${category.name}`);
  revalidatePath('/dashboard/expenses/categories');
  return { success: true };
}

export async function updateExpenseCategory(id: string, formData: FormData) {
  const session = await requirePermission('EXPENSES_SETTINGS');

  const data = categorySchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
    isActive: formData.get('isActive') === 'true',
  });

  const existing = await prisma.expenseCategory.findUnique({
    where: {
      tenantId_name: {
        tenantId: session.tenantId,
        name: data.name,
      }
    }
  });

  if (existing && existing.id !== id) {
    throw new Error('Another expense category with this name already exists');
  }

  const category = await prisma.expenseCategory.update({
    where: { id, tenantId: session.tenantId },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      updatedBy: session.userId,
    }
  });

  await logAudit(session.tenantId, session.userId, 'EXPENSE_CATEGORY_UPDATE', 'ExpenseCategory', category.id, `Updated expense category ${category.name}`);
  revalidatePath('/dashboard/expenses/categories');
  return { success: true };
}
