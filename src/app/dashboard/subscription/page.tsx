import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SubscriptionDashboardPage() {
  const session = await getSession();
  if (!session || !session.tenantId) redirect('/login');

  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId: session.tenantId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
        <p className="text-gray-500">Manage your subscription, billing, and plans.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!subscription ? (
              <div className="text-sm text-gray-500">No active subscription found.</div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">{subscription.plan.name}</span>
                  <Badge variant={
                    subscription.status === 'ACTIVE' ? 'default' :
                    subscription.status === 'TRIAL' ? 'secondary' :
                    'destructive'
                  }>
                    {subscription.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="block mb-1">
                    Amount: {subscription.plan.price.toString()} / {subscription.plan.billingInterval.toLowerCase()}
                  </span>
                  <span className="block mb-1">
                    Started: {format(new Date(subscription.startDate), 'MMM d, yyyy')}
                  </span>
                  {subscription.endDate && (
                    <span className="block text-gray-900 font-medium mt-2">
                      Next Billing Date: {format(new Date(subscription.endDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Link href="/dashboard/subscription/plans">
              <Button>Change Plan</Button>
            </Link>
            <Link href="/dashboard/subscription/billing-history">
              <Button variant="outline">Billing History</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Your current plan usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.plan.limits ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Max Users</span>
                  <span className="font-medium">{(subscription.plan.limits as any).USERS || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Max Customers</span>
                  <span className="font-medium">{(subscription.plan.limits as any).CUSTOMERS || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Max Staff</span>
                  <span className="font-medium">{(subscription.plan.limits as any).STAFF || 'Unlimited'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No limits information available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
