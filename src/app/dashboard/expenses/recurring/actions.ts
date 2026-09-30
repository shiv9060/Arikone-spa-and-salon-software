'use server';
import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { RecurringExpenseFrequency, PaymentMode } from '@prisma/client';

const recurringExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  frequency: z.nativeEnum(RecurringExpenseFrequency),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  vendorName: z.string().optional(),
  status: z.boolean().default(true),
});

export async function createRecurringExpense(formData: FormData) {
  const session = await requirePermission('EXPENSES_CREATE');

  const data = recurringExpenseSchema.parse({
    categoryId: formData.get('categoryId'),
    title: formData.get('title'),
    description: formData.get('description'),
    amount: formData.get('amount'),
    frequency: formData.get('frequency'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || undefined,
    paymentMode: formData.get('paymentMode') || undefined,
    vendorName: formData.get('vendorName') || undefined,
    status: formData.get('status') !== 'false',
  });

  const nextDueDate = data.startDate;

  const recurringExpense = await prisma.recurringExpense.create({
    data: {
      tenantId: session.tenantId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      amount: data.amount,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      nextDueDate,
      paymentMode: data.paymentMode,
      vendorName: data.vendorName,
      status: data.status,
      createdBy: session.userId,
    }
  });

  await logAudit(session.tenantId, session.userId, 'RECURRING_EXPENSE_CREATE', 'RecurringExpense', recurringExpense.id, `Created recurring expense ${recurringExpense.title}`);
  revalidatePath('/dashboard/expenses/recurring');
  return { success: true };
}

export async function toggleRecurringExpenseStatus(id: string, currentStatus: boolean) {
  const session = await requirePermission('EXPENSES_UPDATE');
  const newStatus = !currentStatus;

  const expense = await prisma.recurringExpense.update({
    where: { id, tenantId: session.tenantId },
    data: { status: newStatus, updatedBy: session.userId }
  });

  await logAudit(session.tenantId, session.userId, 'RECURRING_EXPENSE_UPDATE', 'RecurringExpense', expense.id, `Updated recurring expense status to ${newStatus}`);
  revalidatePath('/dashboard/expenses/recurring');
  return { success: true };
}
