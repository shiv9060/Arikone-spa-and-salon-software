'use server';

import { z } from 'zod';
import { requirePermission } from '@/lib/auth/auth-utils';
import { 
  updateBusinessProfile, 
  updateAddress, 
  updateInvoiceSettings, 
  updateRegionalSettings,
  updateFeedbackSettings
} from '@/services/settings.service';
import { revalidatePath } from 'next/cache';

const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  businessType: z.string().nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  taxNumber: z.string().nullable().optional(),
});

const addressSchema = z.object({
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().min(1, 'Country is required'),
});

const invoiceSchema = z.object({
  invoicePrefix: z.string().regex(/^[A-Za-z0-9-_]+$/, 'Prefix must only contain letters, numbers, hyphens or underscores'),
  defaultTax: z.coerce.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100%'),
  invoiceFooter: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
});

const regionalSchema = z.object({
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
});

const feedbackSchema = z.object({
  enabled: z.boolean(),
  delayMinutes: z.coerce.number().min(0),
  expiryDays: z.coerce.number().min(1).max(365),
  templateId: z.string().optional().nullable(),
  minimumRating: z.coerce.number().min(1).max(5),
  reviewLink: z.string().url().optional().or(z.literal('')),
  allowComments: z.boolean(),
  frequencyProtectionDays: z.coerce.number().min(0),
});

export async function updateBusinessProfileAction(formData: FormData) {
  const user = await requirePermission('SETTINGS_UPDATE');
  
  const parsed = businessProfileSchema.safeParse({
    name: formData.get('name'),
    businessType: formData.get('businessType') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    taxNumber: formData.get('taxNumber') || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateBusinessProfile(user.tenantId, user.userId, parsed.data);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateAddressAction(formData: FormData) {
  const user = await requirePermission('SETTINGS_UPDATE');
  
  const parsed = addressSchema.safeParse({
    address: formData.get('address') || null,
    city: formData.get('city') || null,
    state: formData.get('state') || null,
    postalCode: formData.get('postalCode') || null,
    country: formData.get('country'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateAddress(user.tenantId, user.userId, parsed.data);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateInvoiceAction(formData: FormData) {
  const user = await requirePermission('SETTINGS_UPDATE');
  
  const parsed = invoiceSchema.safeParse({
    invoicePrefix: formData.get('invoicePrefix'),
    defaultTax: formData.get('defaultTax'),
    invoiceFooter: formData.get('invoiceFooter') || null,
    displayName: formData.get('displayName') || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateInvoiceSettings(user.tenantId, user.userId, parsed.data);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateRegionalAction(formData: FormData) {
  const user = await requirePermission('SETTINGS_UPDATE');
  
  const parsed = regionalSchema.safeParse({
    currency: formData.get('currency'),
    timezone: formData.get('timezone'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateRegionalSettings(user.tenantId, user.userId, parsed.data);
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateFeedbackSettingsAction(formData: FormData) {
  const user = await requirePermission('FEEDBACK_SETTINGS');
  
  const parsed = feedbackSchema.safeParse({
    enabled: formData.get('enabled') === 'on',
    delayMinutes: formData.get('delayMinutes') || 0,
    expiryDays: formData.get('expiryDays') || 7,
    templateId: formData.get('templateId') || null,
    minimumRating: formData.get('minimumRating') || 1,
    reviewLink: formData.get('reviewLink') || '',
    allowComments: formData.get('allowComments') === 'on',
    frequencyProtectionDays: formData.get('frequencyProtectionDays') || 30,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await updateFeedbackSettings(user.tenantId, user.userId, { feedbackSettings: parsed.data });
  revalidatePath('/dashboard/settings');
  return { success: true };
}
