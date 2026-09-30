'use server';

import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import {
  createOffer,
  updateOffer,
  deleteOffer,
  validateOfferForInvoice,
  CreateOfferInput,
  UpdateOfferInput,
  ValidateOfferInput
} from '@/services/offer.service';
import { revalidatePath } from 'next/cache';

export async function createOfferAction(data: CreateOfferInput) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!hasPermission(session.role, 'OFFERS_CREATE')) throw new Error('Forbidden');

  const offer = await createOffer(session.tenantId, session.userId, data);
  revalidatePath('/dashboard/offers');
  return { success: true, id: offer.id };
}

export async function updateOfferAction(offerId: string, data: UpdateOfferInput) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!hasPermission(session.role, 'OFFERS_UPDATE')) throw new Error('Forbidden');

  const offer = await updateOffer(session.tenantId, offerId, session.userId, data);
  revalidatePath('/dashboard/offers');
  revalidatePath(`/dashboard/offers/${offerId}`);
  return { success: true, id: offer.id };
}

export async function deleteOfferAction(offerId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!hasPermission(session.role, 'OFFERS_DELETE')) throw new Error('Forbidden');

  await deleteOffer(session.tenantId, offerId, session.userId);
  revalidatePath('/dashboard/offers');
  return { success: true };
}

export async function validateOfferAction(data: ValidateOfferInput) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  // This can be called by RECEPTIONIST during billing
  if (!hasPermission(session.role, 'BILLING_CREATE') && !hasPermission(session.role, 'OFFERS_VIEW')) {
    throw new Error('Forbidden');
  }

  const result = await validateOfferForInvoice(session.tenantId, data);
  return result;
}
