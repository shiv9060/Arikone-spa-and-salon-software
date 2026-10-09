'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { Prisma } from '@prisma/client';

export async function getCampaigns(page = 1, pageSize = 10, search = '') {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'WHATSAPP_CAMPAIGNS_VIEW')) {
    throw new Error('Unauthorized');
  }

  const where: Prisma.WhatsAppCampaignWhereInput = {
    tenantId: session.tenantId,
    name: search ? { contains: search, mode: 'insensitive' } : undefined,
  };

  const [campaigns, total] = await Promise.all([
    prisma.whatsAppCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        template: {
          select: { name: true },
        },
      },
    }),
    prisma.whatsAppCampaign.count({ where }),
  ]);

  return { campaigns, total };
}

export async function deleteCampaign(campaignId: string) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'WHATSAPP_CAMPAIGNS_CANCEL')) {
    throw new Error('Unauthorized');
  }

  // Ensure campaign belongs to tenant
  const campaign = await prisma.whatsAppCampaign.findFirst({
    where: { id: campaignId, tenantId: session.tenantId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (['RUNNING', 'QUEUED'].includes(campaign.status)) {
    throw new Error('Cannot delete a running or queued campaign. Cancel it first.');
  }

  await prisma.whatsAppCampaign.delete({
    where: { id: campaignId },
  });

  revalidatePath('/dashboard/whatsapp/campaigns');
  return { success: true };
}
