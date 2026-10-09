import { CheckoutOptions, CheckoutResult, PaymentVerificationResult, SubscriptionPaymentProvider } from './provider.interface';

export class MockPaymentProvider implements SubscriptionPaymentProvider {
  async createCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
    const mockId = `mock_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mockCustId = `mock_cust_${options.tenantId}`;
    
    // Simulate hosted checkout url
    const url = `/api/billing/mock-checkout?id=${mockId}&planId=${options.planId}&tenantId=${options.tenantId}&amount=${options.amount}&successUrl=${encodeURIComponent(options.successUrl)}&cancelUrl=${encodeURIComponent(options.cancelUrl)}`;

    return {
      id: mockId,
      url,
      providerCustomerId: mockCustId,
      status: 'CREATED'
    };
  }

  async verifyPayment(verificationData: any): Promise<PaymentVerificationResult> {
    // In our mock, if status === 'success', it's verified.
    if (verificationData.status === 'success') {
      return {
        verified: true,
        transactionId: `mock_txn_${Date.now()}`,
        orderId: verificationData.orderId,
        amount: Number(verificationData.amount),
        currency: 'INR', // Default for mock
        status: 'PAID',
        paymentMethod: 'mock_card'
      };
    }

    return {
      verified: false,
      transactionId: `mock_txn_fail_${Date.now()}`,
      orderId: verificationData.orderId,
      status: 'FAILED',
      failureReason: 'Mock failed payment'
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    return true; // Mock cancellation always succeeds
  }

  async getCheckoutStatus(checkoutId: string): Promise<PaymentVerificationResult> {
    // Just a mock implementation returning a pending state
    return {
      verified: false,
      orderId: checkoutId,
      status: 'PENDING'
    };
  }

  async handleWebhook(payload: string, signature: string): Promise<any> {
    // Basic JSON parse for mock webhook
    return JSON.parse(payload);
  }
}
