'use server';

import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const createPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  price: z.coerce.number().min(0),
  billingInterval: z.enum(['MONTHLY', 'YEARLY']),
  description: z.string().optional(),
});

export async function createPlanAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    price: formData.get('price'),
    billingInterval: formData.get('billingInterval') as string,
    description: formData.get('description') as string,
  };

  const parsed = createPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data provided.' };
  }

  // Parse features and limits
  const features: Record<string, boolean> = {};
  const limits: Record<string, number> = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('feat_')) {
      features[key.replace('feat_', '')] = value === 'on';
    } else if (key.startsWith('limit_')) {
      limits[key.replace('limit_', '')] = parseInt(value as string, 10);
    }
  }

  try {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      return { error: 'Plan slug already exists.' };
    }

    await prisma.subscriptionPlan.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        price: parsed.data.price,
        billingInterval: parsed.data.billingInterval,
        description: parsed.data.description,
        features,
        limits,
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: 'platform',
        userId: session.userId,
        action: 'PLAN_CREATED',
        entityType: 'Plan',
        entityId: parsed.data.slug,
        metadata: { name: parsed.data.name }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return { error: 'Failed to create plan.' };
  }
}
