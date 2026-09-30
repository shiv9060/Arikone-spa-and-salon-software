import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function AdminPlansPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: 'asc' },
    include: {
      _count: {
        select: { tenants: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-gray-500">Manage SaaS billing plans and feature gates.</p>
        </div>
        <Link href="/admin/plans/new">
          <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>/{plan.slug}</CardDescription>
                </div>
                {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                {plan.price.toString()}
                <span className="text-sm font-normal text-gray-500"> / {plan.billingInterval.toLowerCase()}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                {plan.description || 'No description provided.'}
              </div>
              
              <div className="border-t pt-4">
                <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Usage Limits</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(plan.limits as any).map(([key, val]) => (
                    <div key={key} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="capitalize">{key}</span>
                      <span className="font-medium">{val as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center text-sm">
                <span className="text-gray-500">Active Tenants</span>
                <span className="font-medium">{plan._count.tenants}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-white rounded-lg border shadow-sm">
            <p className="text-gray-500">No subscription plans created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
