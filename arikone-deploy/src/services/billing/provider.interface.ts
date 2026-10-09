export interface CheckoutOptions {
  tenantId: string;
  planId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
  customerMobile?: string;
}

export interface CheckoutResult {
  id: string; // Checkout session or order ID
  url?: string; // Redirect URL if hosted checkout
  providerCustomerId?: string;
  status: 'PENDING' | 'CREATED';
}

export interface PaymentVerificationResult {
  verified: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: 'PAID' | 'FAILED' | 'PENDING';
  failureReason?: string;
  paymentMethod?: string;
}

export interface SubscriptionPaymentProvider {
  createCheckout(options: CheckoutOptions): Promise<CheckoutResult>;
  verifyPayment(verificationData: any): Promise<PaymentVerificationResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
  getCheckoutStatus(checkoutId: string): Promise<PaymentVerificationResult>;
  handleWebhook(payload: string, signature: string): Promise<any>;
}
