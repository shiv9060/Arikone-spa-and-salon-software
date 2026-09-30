import 'server-only';
import prisma from '@/lib/db/prisma';
import { MockPaymentProvider } from './mock-provider';
import { SubscriptionPaymentProvider, PaymentVerificationResult } from './provider.interface';
import { Decimal } from '@prisma/client/runtime/library';
import { addMonths, addYears } from 'date-fns';

const PROVIDER = process.env.PAYMENT_PROVIDER || 'MOCK';

export function getPaymentProvider(): SubscriptionPaymentProvider {
  if (PROVIDER === 'MOCK') {
    return new MockPaymentProvider();
  }
  // Add other providers (e.g. RazorpayProvider) here when configured
  return new MockPaymentProvider();
}

export async function createSubscriptionCheckout(tenantId: string, planId: string, successUrl: string, cancelUrl: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  const provider = getPaymentProvider();
  const amount = Number(plan.price);
  
  const checkout = await provider.createCheckout({
    tenantId,
    planId,
    amount,
    currency: 'INR',
    successUrl,
    cancelUrl,
    customerName: tenant.name,
    customerEmail: tenant.email || undefined,
    customerMobile: tenant.phone || undefined
  });

  // Track customer internally
  if (checkout.providerCustomerId) {
    await prisma.paymentCustomer.upsert({
      where: {
        provider_providerCustomerId: {
          provider: 'MOCK',
          providerCustomerId: checkout.providerCustomerId
        }
      },
      create: {
        tenantId,
        provider: 'MOCK',
        providerCustomerId: checkout.providerCustomerId,
        name: tenant.name,
        email: tenant.email || '',
        mobile: tenant.phone || '',
      },
      update: {
        name: tenant.name,
        email: tenant.email || '',
      }
    });
  }

  // Create pending transaction
  await prisma.paymentTransaction.create({
    data: {
      tenantId,
      provider: 'MOCK',
      providerOrderId: checkout.id,
      providerTransactionId: checkout.id, // Placeholder for order-based flow until payment is completed
      amount: new Decimal(amount),
      currency: 'INR',
      status: 'PENDING'
    }
  });

  return checkout;
}

export async function handlePaymentSuccess(tenantId: string, planId: string, verificationResult: PaymentVerificationResult) {
  if (!verificationResult.verified || verificationResult.status !== 'PAID') {
    throw new Error('Payment not verified as paid');
  }

  return await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const transaction = await tx.paymentTransaction.findFirst({
      where: { providerOrderId: verificationResult.orderId }
    });

    if (!transaction) throw new Error('Transaction not found');
    
    // Prevent duplicate processing
    if (transaction.status === 'PAID') return transaction;

    const startDate = new Date();
    const endDate = plan.billingInterval === 'YEARLY' ? addYears(startDate, 1) : addMonths(startDate, 1);

    // Update or create subscription
    let subscription = await tx.tenantSubscription.findFirst({
      where: { tenantId }
    });

    if (subscription) {
      subscription = await tx.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          cancelledAt: null,
        }
      });
    } else {
      subscription = await tx.tenantSubscription.create({
        data: {
          tenantId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate
        }
      });
    }

    // Update Tenant Status
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'ACTIVE',
        planId: plan.id
      }
    });

    // Update Transaction
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        providerTransactionId: verificationResult.transactionId || transaction.providerTransactionId,
        paymentMethod: verificationResult.paymentMethod,
        paidAt: new Date(),
        subscriptionId: subscription.id
      }
    });

    // Create events
    await tx.subscriptionEvent.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        eventType: 'PAYMENT_SUCCESS',
        metadata: { transactionId: verificationResult.transactionId, amount: verificationResult.amount }
      }
    });

    await tx.subscriptionEvent.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        eventType: 'ACTIVATED'
      }
    });
    
    // Audit log
    await tx.auditLog.create({
      data: {
        tenantId: 'platform',
        userId: 'SYSTEM',
        action: 'SUBSCRIPTION_ACTIVATED',
        entityType: 'Tenant',
        entityId: tenantId,
        metadata: { planId: plan.id, transactionId: verificationResult.transactionId }
      }
    });

    return transaction;
  });
}

export async function handlePaymentFailure(tenantId: string, verificationResult: PaymentVerificationResult) {
  if (!verificationResult.orderId) return;

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.paymentTransaction.findFirst({
      where: { providerOrderId: verificationResult.orderId }
    });

    if (!transaction || transaction.status === 'PAID') return;

    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        failureReason: verificationResult.failureReason || 'Payment failed',
      }
    });

    const subscription = await tx.tenantSubscription.findFirst({ where: { tenantId } });
    if (subscription) {
      await tx.subscriptionEvent.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          eventType: 'PAYMENT_FAILED',
          metadata: { reason: verificationResult.failureReason, orderId: verificationResult.orderId }
        }
      });
    }
    
    await tx.auditLog.create({
      data: {
        tenantId: 'platform',
        userId: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        entityType: 'Tenant',
        entityId: tenantId,
        metadata: { orderId: verificationResult.orderId, reason: verificationResult.failureReason }
      }
    });
  });
}
