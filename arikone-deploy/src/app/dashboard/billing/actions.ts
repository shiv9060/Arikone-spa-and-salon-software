'use server';

import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import {
  createInvoice,
  finalizeInvoice,
  cancelInvoice,
  createPayment,
  CreateInvoiceInput,
  CreatePaymentInput
} from '@/services/billing.service';

export async function createInvoiceAction(data: CreateInvoiceInput) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'BILLING_CREATE')) {
      return { error: 'Unauthorized' };
    }

    const invoice = await createInvoice(session.tenantId, session.userId, data);
    revalidatePath('/dashboard/billing');
    return { invoiceId: invoice.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function finalizeInvoiceAction(invoiceId: string) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'BILLING_UPDATE')) {
      return { error: 'Unauthorized' };
    }

    await finalizeInvoice(session.tenantId, invoiceId, session.userId);
    revalidatePath(`/dashboard/billing/${invoiceId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function cancelInvoiceAction(invoiceId: string) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'BILLING_CANCEL')) {
      return { error: 'Unauthorized' };
    }

    await cancelInvoice(session.tenantId, invoiceId, session.userId);
    revalidatePath(`/dashboard/billing/${invoiceId}`);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function recordPaymentAction(invoiceId: string, data: CreatePaymentInput) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'PAYMENTS_CREATE')) {
      return { error: 'Unauthorized' };
    }

    await createPayment(session.tenantId, invoiceId, session.userId, data);
    revalidatePath(`/dashboard/billing/${invoiceId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
