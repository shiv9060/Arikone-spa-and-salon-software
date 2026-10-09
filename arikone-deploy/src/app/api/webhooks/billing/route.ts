import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getPaymentProvider } from '@/services/billing/billing.service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-provider-signature') || '';
    
    // Compute simple hash for idempotency checking
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    const provider = getPaymentProvider();
    
    // Let provider verify signature and parse event
    let eventPayload: any;
    try {
      eventPayload = await provider.handleWebhook(rawBody, signature);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (!eventPayload.eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Check idempotency
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'MOCK',
          eventId: eventPayload.eventId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ received: true, note: 'already processed' });
    }

    // Store pending event
    const webhook = await prisma.webhookEvent.create({
      data: {
        provider: 'MOCK',
        eventId: eventPayload.eventId,
        eventType: eventPayload.eventType || 'unknown',
        payloadHash,
        status: 'PENDING'
      }
    });

    // In a real system, you might queue this for a background worker.
    // For now, process synchronously:
    try {
      // e.g. processSubscriptionRenewal(eventPayload)
      // await ...
      
      await prisma.webhookEvent.update({
        where: { id: webhook.id },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });
    } catch (err: any) {
      await prisma.webhookEvent.update({
        where: { id: webhook.id },
        data: { status: 'FAILED', errorMessage: err.message }
      });
      // Return 200 so provider doesn't infinitely retry unless we want it to
      // Depending on provider, might return 500
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
