'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { createCheckoutAction } from '../actions';
import { toast } from 'sonner';

export function CheckoutButton({ planId, price, name }: { planId: string, price: string, name: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await createCheckoutAction(planId);
      if (res.error) {
        toast.error(res.error);
        setLoading(false);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      toast.error('An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <Button 
      className="w-full bg-purple-600 hover:bg-purple-700" 
      onClick={handleCheckout} 
      disabled={loading}
    >
      {loading ? 'Processing...' : `Subscribe to ${name}`}
    </Button>
  );
}
