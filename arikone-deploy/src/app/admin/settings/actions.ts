'use server';

import { getSession } from '@/lib/auth/session';
import { updatePlatformSettings } from '@/services/platform/settings.service';
import { sendTestEmail } from '@/services/platform/email.service';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';

export async function savePlatformSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  const updates: any = {};
  
  // Basic mapping
  const keys = [
    'platformName', 'supportEmail', 'supportPhone', 'supportWebsite',
    'defaultCountry', 'defaultCurrency', 'defaultTimezone',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpFromName', 'smtpFromEmail',
    'whatsappProvider'
  ];

  for (const key of keys) {
    if (formData.has(key)) {
      updates[key] = formData.get(key) as string;
    }
  }

  if (formData.has('smtpPort')) {
    updates.smtpPort = parseInt(formData.get('smtpPort') as string, 10);
  }

  if (formData.has('whatsappEnabled')) {
    updates.whatsappEnabled = formData.get('whatsappEnabled') === 'true';
  }

  if (formData.has('maintenanceEnabled')) {
    updates.maintenanceEnabled = formData.get('maintenanceEnabled') === 'true';
    updates.maintenanceMessage = formData.get('maintenanceMessage') as string;
  }

  // Password masking safety:
  const password = formData.get('smtpPasswordHash');
  if (password && password !== '********') {
    updates.smtpPasswordHash = password as string;
  }

  await updatePlatformSettings(updates);
  
  await prisma.auditLog.create({
    data: {
      tenantId: 'platform',
      userId: session.userId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PlatformSettings',
      entityId: 'global',
      metadata: { updatedKeys: Object.keys(updates) }
    }
  });

  revalidatePath('/admin/settings');
}

export async function sendTestEmailAction(email: string) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
  
  return await sendTestEmail(email);
}
