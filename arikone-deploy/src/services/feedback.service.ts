import 'server-only';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { logAudit } from './audit.service';

export async function queueFeedbackRequest(tenantId: string, appointmentId: string, userId?: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant) return;

    const feedbackSettings = tenant.settings?.feedbackSettings as any;
    if (!feedbackSettings?.enabled) return;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true }
    });

    if (!appointment || !appointment.customerId) return;
    
    if (appointment.customer.whatsappOptOut) return; // Opted out of automated messages

    // Frequency protection
    const protectionDays = feedbackSettings.frequencyProtectionDays || 30;
    if (protectionDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - protectionDays);

      const recentRequest = await prisma.feedbackRequest.findFirst({
        where: {
          tenantId,
          customerId: appointment.customerId,
          createdAt: { gte: cutoff },
        }
      });

      if (recentRequest) return; // Customer was asked recently
    }

    // Idempotency check for this specific appointment
    const existingForAppt = await prisma.feedbackRequest.findUnique({
      where: {
        tenantId_appointmentId: {
          tenantId,
          appointmentId,
        }
      }
    });

    if (existingForAppt) return;

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiryDays = feedbackSettings.expiryDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const delayMinutes = feedbackSettings.delayMinutes || 0;
    const scheduledAt = new Date();
    if (delayMinutes > 0) {
      scheduledAt.setMinutes(scheduledAt.getMinutes() + delayMinutes);
    }

    const feedbackRequest = await prisma.feedbackRequest.create({
      data: {
        tenantId,
        customerId: appointment.customerId,
        appointmentId,
        serviceId: appointment.serviceId,
        staffId: appointment.staffId,
        tokenHash,
        expiresAt,
        status: delayMinutes > 0 ? 'QUEUED' : 'PENDING'
      }
    });

    await logAudit(tenantId, userId || 'SYSTEM', 'FEEDBACK_REQUEST_CREATED', 'FeedbackRequest', feedbackRequest.id, `Feedback request created for ${appointment.customer.name}`);

    // Create message job if there's a template
    const templateId = feedbackSettings.templateId;
    if (templateId) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId, tenantId }
      });

      if (template) {
        // Replace variables in template
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const feedbackLink = `${baseUrl}/feedback/${rawToken}`;
        
        let content = template.content;
        content = content.replace(/{{customer_name}}/g, appointment.customer.name.split(' ')[0]);
        content = content.replace(/{{salon_name}}/g, tenant.settings?.displayName || tenant.name);
        content = content.replace(/{{feedback_link}}/g, feedbackLink);

        await prisma.messageJob.create({
          data: {
            tenantId,
            type: 'FEEDBACK_REQUEST',
            status: 'PENDING',
            recipient: appointment.customer.mobile!,
            payload: { content, feedbackRequestId: feedbackRequest.id },
            idempotencyKey: `feedback_${feedbackRequest.id}`,
            scheduledAt
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to queue feedback request:', err);
  }
}
