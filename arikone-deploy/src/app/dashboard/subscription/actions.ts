'use server';

import { getSession } from '@/lib/auth/session';
import { createSubscriptionCheckout } from '@/services/billing/billing.service';

export async function createCheckoutAction(planId: string) {
  const session = await getSession();
  if (!session || !session.tenantId) return { error: 'Unauthorized' };

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/subscription/verify?status=success`;
    const cancelUrl = `${baseUrl}/dashboard/subscription/plans?status=cancelled`;

    const checkout = await createSubscriptionCheckout(session.tenantId, planId, successUrl, cancelUrl);
    
    return { url: checkout.url };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return { error: 'Failed to initiate checkout.' };
  }
}
