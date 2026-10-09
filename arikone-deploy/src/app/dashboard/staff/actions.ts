'use server';

import { z } from 'zod';
import { requirePermission } from '@/lib/auth/auth-utils';
import { createStaff, updateStaff, deactivateStaff } from '@/services/staff.service';
import { revalidatePath } from 'next/cache';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  designation: z.string().nullable().optional(),
  joiningDate: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  commissionType: z.string().nullable().optional(),
  commissionValue: z.coerce.number().min(0, 'Commission cannot be negative').nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createStaffAction(formData: FormData) {
  const user = await requirePermission('STAFF_CREATE');
  
  const parsed = staffSchema.safeParse({
    name: formData.get('name'),
    mobile: formData.get('mobile') || null,
    email: formData.get('email') || null,
    designation: formData.get('designation') || null,
    joiningDate: formData.get('joiningDate') || null,
    status: formData.get('status') || 'ACTIVE',
    commissionType: formData.get('commissionType') || null,
    commissionValue: formData.get('commissionValue') || null,
    notes: formData.get('notes') || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const payload = {
    ...parsed.data,
    joiningDate: parsed.data.joiningDate ? new Date(parsed.data.joiningDate) : null,
  };

  await createStaff(user.tenantId, user.userId, payload);
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function updateStaffAction(staffId: string, formData: FormData) {
  const user = await requirePermission('STAFF_UPDATE');
  
  const parsed = staffSchema.safeParse({
    name: formData.get('name'),
    mobile: formData.get('mobile') || null,
    email: formData.get('email') || null,
    designation: formData.get('designation') || null,
    joiningDate: formData.get('joiningDate') || null,
    status: formData.get('status') || 'ACTIVE',
    commissionType: formData.get('commissionType') || null,
    commissionValue: formData.get('commissionValue') || null,
    notes: formData.get('notes') || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const payload = {
    ...parsed.data,
    joiningDate: parsed.data.joiningDate ? new Date(parsed.data.joiningDate) : null,
  };

  await updateStaff(user.tenantId, user.userId, staffId, payload);
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function deactivateStaffAction(staffId: string) {
  const user = await requirePermission('STAFF_UPDATE');
  await deactivateStaff(user.tenantId, user.userId, staffId);
  revalidatePath('/dashboard/staff');
  return { success: true };
}
