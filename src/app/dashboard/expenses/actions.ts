'use server';
import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/services/audit.service';
import { ExpenseStatus, PaymentMode } from '@prisma/client';

const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  expenseDate: z.string().transform(str => new Date(str)),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  vendorName: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z.nativeEnum(ExpenseStatus).default(ExpenseStatus.PENDING),
});

async function generateExpenseNumber(tenantId: string): Promise<string> {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM "Expense" WHERE "tenantId" = ${tenantId}
  `;
  const count = Number(result[0].count) + 1;
  return `EXP-${count.toString().padStart(6, '0')}`;
}

export async function createExpense(formData: FormData) {
  const session = await requirePermission('EXPENSES_CREATE');

  const data = expenseSchema.parse({
    categoryId: formData.get('categoryId'),
    title: formData.get('title'),
    description: formData.get('description'),
    amount: formData.get('amount'),
    expenseDate: formData.get('expenseDate'),
    paymentMode: formData.get('paymentMode') || undefined,
    vendorName: formData.get('vendorName') || undefined,
    referenceNumber: formData.get('referenceNumber') || undefined,
    status: formData.get('status') || ExpenseStatus.PENDING,
  });

  const expenseNumber = await generateExpenseNumber(session.tenantId);

  const expense = await prisma.expense.create({
    data: {
      tenantId: session.tenantId,
      expenseNumber,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      amount: data.amount,
      expenseDate: data.expenseDate,
      paymentMode: data.paymentMode,
      vendorName: data.vendorName,
      referenceNumber: data.referenceNumber,
      status: data.status,
      createdBy: session.userId,
    }
  });

  await logAudit(session.tenantId, session.userId, 'EXPENSE_CREATE', 'Expense', expense.id, `Created expense ${expense.expenseNumber} for ${expense.amount}`);
  revalidatePath('/dashboard/expenses');
  return { success: true, expenseId: expense.id };
}

export async function actionUpdateExpenseStatus(id: string, status: ExpenseStatus) {
  const session = await requirePermission(
    status === ExpenseStatus.APPROVED || status === ExpenseStatus.PAID 
      ? 'EXPENSES_APPROVE' 
      : status === ExpenseStatus.CANCELLED
      ? 'EXPENSES_CANCEL'
      : 'EXPENSES_UPDATE'
  );

  const existing = await prisma.expense.findUnique({
    where: { id, tenantId: session.tenantId }
  });

  if (!existing) throw new Error('Expense not found');

  if (existing.status === ExpenseStatus.PAID && status !== ExpenseStatus.CANCELLED) {
    throw new Error('Cannot change status of a paid expense except to cancel');
  }
  if (existing.status === ExpenseStatus.CANCELLED) {
    throw new Error('Cannot modify a cancelled expense');
  }

  const updateData: any = { status };
  if (status === ExpenseStatus.APPROVED || status === ExpenseStatus.PAID) {
    updateData.approvedBy = session.userId;
  }

  const expense = await prisma.expense.update({
    where: { id, tenantId: session.tenantId },
    data: updateData,
  });

  await logAudit(session.tenantId, session.userId, 'EXPENSE_STATUS_UPDATE', 'Expense', expense.id, `Updated expense ${expense.expenseNumber} status to ${status}`);
  revalidatePath('/dashboard/expenses');
  return { success: true };
}
