'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createCustomer, updateCustomer, archiveCustomer, restoreCustomer } from '@/services/customer.service';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().min(10, 'Valid mobile number is required').trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  whatsappOptOut: z.coerce.boolean().optional().default(false)
});

export async function createCustomerAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'CUSTOMERS_CREATE')) throw new Error('Unauthorized');

    const data = Object.fromEntries(formData);
    const parsed = customerSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, mobile, email, dateOfBirth, gender, address, notes, whatsappOptOut } = parsed.data;
    
    // Convert DOB
    let dob: Date | null = null;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (dob > new Date()) {
        return { error: 'Date of birth cannot be in the future' };
      }
    }

    const customer = await createCustomer(session.tenantId, session.userId, {
      name,
      mobile,
      email: email || null,
      dateOfBirth: dob,
      gender: gender || null,
      address: address || null,
      notes: notes || null,
      whatsappOptOut: whatsappOptOut || false
    });

    revalidatePath('/dashboard/customers');
    return { success: true, customerId: customer.id };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to create customer' };
  }
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'CUSTOMERS_UPDATE')) throw new Error('Unauthorized');

    const data = Object.fromEntries(formData);
    const parsed = customerSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, mobile, email, dateOfBirth, gender, address, notes, whatsappOptOut } = parsed.data;
    
    let dob: Date | null = null;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (dob > new Date()) {
        return { error: 'Date of birth cannot be in the future' };
      }
    }

    await updateCustomer(session.tenantId, session.userId, customerId, {
      name,
      mobile,
      email: email || null,
      dateOfBirth: dob,
      gender: gender || null,
      address: address || null,
      notes: notes || null,
      whatsappOptOut: whatsappOptOut || false
    });

    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath(`/dashboard/customers/${customerId}/edit`);
    return { success: true, customerId };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to update customer' };
  }
}

export async function archiveCustomerAction(customerId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'CUSTOMERS_DELETE')) throw new Error('Unauthorized');

    await archiveCustomer(session.tenantId, session.userId, customerId);
    
    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to archive customer' };
  }
}

export async function restoreCustomerAction(customerId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'CUSTOMERS_UPDATE')) throw new Error('Unauthorized');

    await restoreCustomer(session.tenantId, session.userId, customerId);
    
    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to restore customer' };
  }
}
