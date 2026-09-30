'use server';

import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';

export type AudienceFilter = {
  type: 'ALL';
};

export async function estimateAudienceSize(filter: AudienceFilter) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const where: Prisma.CustomerWhereInput = { tenantId: session.tenantId, whatsappOptOut: false };

  const count = await prisma.customer.count({ where });
  return count;
}

export async function createCampaign(data: {
  name: string;
  campaignType: string;
  templateId: string;
  offerId?: string;
  audienceFilter: AudienceFilter;
  scheduleTime?: Date;
}) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'WHATSAPP_CAMPAIGNS_CREATE')) {
    throw new Error('Unauthorized');
  }

  // 1. Get audience
  const where: Prisma.CustomerWhereInput = { tenantId: session.tenantId, whatsappOptOut: false };

  const customers = await prisma.customer.findMany({
    where,
    select: { id: true, mobile: true },
  });

  if (customers.length === 0) {
    throw new Error('Audience is empty. Please broaden your filters.');
  }

  // 2. Create Campaign and Recipients
  const status = data.scheduleTime ? 'SCHEDULED' : 'QUEUED';

  const campaign = await prisma.$transaction(async (tx) => {
    const newCampaign = await tx.whatsAppCampaign.create({
      data: {
        tenantId: session.tenantId,
        name: data.name,
        campaignType: data.campaignType as any,
        templateId: data.templateId,
        offerId: data.offerId || null,
        status,
        scheduledAt: data.scheduleTime,
        totalRecipients: customers.length,
        queuedCount: customers.length,
        audienceDefinition: data.audienceFilter,
        createdBy: session.userId,
      },
    });

    // Bulk create recipients
    // Prisma does not support createMany with relations in a simple way for SQLite if we needed returns,
    // but we just need to insert them.
    await tx.whatsAppCampaignRecipient.createMany({
      data: customers.map((c) => ({
        tenantId: session.tenantId,
        campaignId: newCampaign.id,
        customerId: c.id,
        phoneNumber: c.mobile,
        status: status === 'SCHEDULED' ? 'PENDING' : 'QUEUED',
        queuedAt: status === 'QUEUED' ? new Date() : null,
      })),
    });
    
    // If it's queued immediately, we should queue them to MessageJob as well for the cron job to pick up.
    if (status === 'QUEUED') {
        const template = await tx.messageTemplate.findUnique({ where: { id: data.templateId }});
        if (template) {
           await tx.messageJob.createMany({
              data: customers.map((c) => ({
                 tenantId: session.tenantId,
                 type: 'OTHER' as const,
                 status: 'PENDING',
                 recipient: c.mobile,
                 payload: { content: template.content, customerId: c.id, campaignId: newCampaign.id },
                 idempotencyKey: `campaign_${newCampaign.id}_${c.id}`,
                 scheduledAt: new Date()
              }))
           });
        }
    }

    return newCampaign;
  });

  return { success: true, campaignId: campaign.id };
}
