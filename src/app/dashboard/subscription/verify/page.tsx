import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getPaymentProvider, handlePaymentSuccess, handlePaymentFailure } from '@/services/billing/billing.service';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function VerifyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; orderId?: string; planId?: string }>;
}) {
  const session = await getSession();
  if (!session || !session.tenantId) redirect('/login');

  const resolvedParams = await searchParams;
  const { status, orderId, planId } = resolvedParams;

  let success = false;
  let message = 'Payment verification failed.';

  if (status === 'success' && orderId && planId) {
    const provider = getPaymentProvider();
    
    // In a real app, you would pass the signature/token from the provider here
    const verification = await provider.verifyPayment({ status, orderId, amount: 0 }); // Mock verification

    if (verification.verified) {
      try {
        await handlePaymentSuccess(session.tenantId, planId, verification);
        success = true;
        message = 'Your payment was successful and your subscription is active.';
      } catch (err: any) {
        console.error('Error handling payment success:', err);
        message = 'We verified your payment but encountered an error updating your subscription. Please contact support.';
      }
    } else {
      await handlePaymentFailure(session.tenantId, verification);
      message = 'Payment could not be verified.';
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white border rounded-xl shadow-sm text-center">
      {success ? (
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      ) : (
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      )}
      
      <h1 className="text-2xl font-bold mb-2">
        {success ? 'Payment Successful' : 'Payment Failed'}
      </h1>
      <p className="text-gray-500 mb-8">{message}</p>
      
      <Link href="/dashboard/subscription">
        <Button className="w-full">Return to Subscription</Button>
      </Link>
    </div>
  );
}
