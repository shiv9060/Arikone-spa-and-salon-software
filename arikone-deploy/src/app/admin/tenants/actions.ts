'use server';

import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { z } from 'zod';
import { getPlatformSettings } from '@/services/platform/settings.service';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  businessType: z.string().optional(),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  planId: z.string().optional()
});

export async function createTenantAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    businessType: formData.get('businessType') as string,
    ownerName: formData.get('ownerName') as string,
    ownerEmail: formData.get('ownerEmail') as string,
    phone: formData.get('phone') as string,
    country: formData.get('country') as string,
    currency: formData.get('currency') as string,
    timezone: formData.get('timezone') as string,
    planId: formData.get('planId') as string | undefined,
  };

  if (rawData.planId === 'none') {
    rawData.planId = undefined;
  }

  const parsed = createTenantSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data provided.' };
  }

  const { data } = parsed;

  try {
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      return { error: 'Tenant slug already exists. Please choose a different one.' };
    }

    const platformSettings = await getPlatformSettings();

    const tenant = await prisma.$transaction(async (tx) => {
      // Create Tenant
      const t = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          businessType: data.businessType,
          email: data.ownerEmail,
          phone: data.phone,
          country: data.country || platformSettings.defaultCountry,
          currency: data.currency || platformSettings.defaultCurrency,
          timezone: data.timezone || platformSettings.defaultTimezone,
          planId: data.planId,
          status: 'ACTIVE',
        }
      });

      // Create Settings
      await tx.tenantSettings.create({
        data: {
          tenantId: t.id,
          displayName: t.name,
          currency: t.currency,
          timezone: t.timezone,
        }
      });

      // Generate Owner Invitation Token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await tx.ownerInvitation.create({
        data: {
          tenantId: t.id,
          email: data.ownerEmail,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        }
      });

      // We'd send an email here with `token`
      console.log(`[Email Mock] Send invitation to ${data.ownerEmail} with token: ${token}`);

      // Log event
      await tx.auditLog.create({
        data: {
          tenantId: t.id,
          userId: session.userId,
          action: 'TENANT_CREATED',
          entityType: 'Tenant',
          entityId: t.id,
          metadata: { name: t.name, slug: t.slug, owner: data.ownerEmail }
        }
      });

      return t;
    });

    return { success: true, tenantId: tenant.id };
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return { error: 'Failed to create tenant.' };
  }
}
