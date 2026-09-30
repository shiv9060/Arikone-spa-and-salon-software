'use server';

import prisma from '@/lib/db/prisma';
import crypto from 'crypto';

export async function getFeedbackRequestData(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const request = await prisma.feedbackRequest.findUnique({
    where: { tokenHash },
    include: {
      tenant: {
        include: { settings: true }
      },
      customer: true,
      service: true,
      staff: true
    }
  });

  return request;
}

export async function submitFeedbackAction(token: string, formData: FormData) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const rating = Number(formData.get('rating'));
  const comment = formData.get('comment')?.toString() || null;

  if (rating < 1 || rating > 5) {
    return { error: 'Invalid rating. Please select 1 to 5 stars.' };
  }

  const request = await prisma.feedbackRequest.findUnique({
    where: { tokenHash },
    include: { tenant: { include: { settings: true } } }
  });

  if (!request) {
    return { error: 'Feedback request not found or invalid token.' };
  }

  if (request.status === 'RESPONDED' || request.respondedAt) {
    return { error: 'Feedback has already been submitted for this request.' };
  }

  if (new Date() > request.expiresAt) {
    return { error: 'This feedback link has expired.' };
  }

  // Update status in a transaction
  try {
    const feedback = await prisma.$transaction(async (tx) => {
      const fb = await tx.customerFeedback.create({
        data: {
          tenantId: request.tenantId,
          requestId: request.id,
          customerId: request.customerId,
          appointmentId: request.appointmentId,
          invoiceId: request.invoiceId,
          serviceId: request.serviceId,
          staffId: request.staffId,
          rating,
          comment
        }
      });

      await tx.feedbackRequest.update({
        where: { id: request.id },
        data: {
          status: 'RESPONDED',
          respondedAt: new Date(),
        }
      });

      return fb;
    });

    const settings = request.tenant.settings?.feedbackSettings as any;
    
    // Check if review link should be shown
    let reviewLink = null;
    if (settings?.reviewLink && rating >= (settings?.minimumRating || 4)) {
      reviewLink = settings.reviewLink;
    }

    return { success: true, reviewLink };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { error: 'Failed to submit feedback. Please try again later.' };
  }
}
