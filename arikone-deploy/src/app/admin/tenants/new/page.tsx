import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TenantCreateForm } from './tenant-create-form';
import prisma from '@/lib/db/prisma';

export default async function AdminNewTenantPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Tenant</h1>
        <p className="text-gray-500">Provision a new salon or spa business on the Arikone platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Enter details to provision a new tenant instance.</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantCreateForm plans={plans} />
        </CardContent>
      </Card>
    </div>
  );
}
