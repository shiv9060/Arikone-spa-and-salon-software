import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { CheckoutButton } from './checkout-button';

export default async function PlansPage() {
  const session = await getSession();
  if (!session || !session.tenantId) redirect('/login');

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });

  const currentSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: session.tenantId, status: { in: ['ACTIVE', 'TRIAL'] } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Select a Plan</h1>
        <p className="text-gray-500">Choose the perfect plan for your salon or spa.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSub?.planId === plan.id;
          const features = plan.features as Record<string, boolean>;
          const featureKeys = Object.keys(features).filter(k => features[k]);
          
          return (
            <Card key={plan.id} className={isCurrent ? 'border-purple-600 shadow-md ring-1 ring-purple-600' : ''}>
              <CardHeader>
                {isCurrent && <span className="text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">Current Plan</span>}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₹{plan.price.toString()}</span>
                  <span className="text-gray-500 ml-1">/ {plan.billingInterval.toLowerCase()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {featureKeys.map(key => (
                    <li key={key} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{key.replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <button className="w-full py-2 bg-gray-100 text-gray-500 rounded-md font-medium cursor-not-allowed" disabled>
                    Current Plan
                  </button>
                ) : (
                  <CheckoutButton planId={plan.id} price={plan.price.toString()} name={plan.name} />
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
