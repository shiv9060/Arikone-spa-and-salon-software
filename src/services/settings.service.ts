import 'server-only';
import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';

export async function getTenantWithSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });
}

export type UpdateBusinessProfileInput = {
  name: string;
  businessType?: string | null;
  email?: string | null;
  phone?: string | null;
  taxNumber?: string | null;
};

export async function updateBusinessProfile(tenantId: string, userId: string, data: UpdateBusinessProfileInput) {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });

  await logAudit(tenantId, userId, 'BUSINESS_PROFILE_UPDATED', 'Tenant', tenantId, 'Business profile updated');
  return tenant;
}

export type UpdateAddressInput = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
};

export async function updateAddress(tenantId: string, userId: string, data: UpdateAddressInput) {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });

  await logAudit(tenantId, userId, 'ADDRESS_UPDATED', 'Tenant', tenantId, 'Business address updated');
  return tenant;
}

export type UpdateRegionalSettingsInput = {
  currency?: string;
  timezone?: string;
};

export async function updateRegionalSettings(tenantId: string, userId: string, data: UpdateRegionalSettingsInput) {
  // Update in Tenant (and potentially TenantSettings if needed, but schema says Tenant has timezone/currency and settings does too)
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });
  
  await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });

  await logAudit(tenantId, userId, 'REGIONAL_SETTINGS_UPDATED', 'Tenant', tenantId, 'Regional settings updated');
  return tenant;
}

export type UpdateInvoiceSettingsInput = {
  invoicePrefix?: string;
  defaultTax?: number;
  invoiceFooter?: string | null;
  displayName?: string | null;
};

export async function updateInvoiceSettings(tenantId: string, userId: string, data: UpdateInvoiceSettingsInput) {
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });

  await logAudit(tenantId, userId, 'INVOICE_SETTINGS_UPDATED', 'TenantSettings', settings.id, 'Invoice settings updated');
  return settings;
}

export type UpdateFeedbackSettingsInput = {
  feedbackSettings: any;
};

export async function updateFeedbackSettings(tenantId: string, userId: string, data: UpdateFeedbackSettingsInput) {
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, feedbackSettings: data.feedbackSettings },
    update: { feedbackSettings: data.feedbackSettings },
  });

  await logAudit(tenantId, userId, 'FEEDBACK_SETTINGS_UPDATED', 'TenantSettings', settings.id, 'Feedback settings updated');
  return settings;
}
