import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const statusFilter = resolvedParams.status || '';

  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (query) {
    where.tenant = {
      name: { contains: query, mode: 'insensitive' }
    };
  }

  const subscriptions = await prisma.tenantSubscription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: true,
      plan: true,
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-gray-500">Manage tenant subscriptions and billing status.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 rounded-t-lg">
          <form className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              name="q"
              defaultValue={query}
              type="search" 
              placeholder="Search by tenant..." 
              className="pl-9 bg-white"
            />
          </form>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Link href="/admin/subscriptions?status=ACTIVE">
              <Badge variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Active</Badge>
            </Link>
            <Link href="/admin/subscriptions?status=TRIAL">
              <Badge variant={statusFilter === 'TRIAL' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Trial</Badge>
            </Link>
            <Link href="/admin/subscriptions?status=PAST_DUE">
              <Badge variant={statusFilter === 'PAST_DUE' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Past Due</Badge>
            </Link>
            <Link href="/admin/subscriptions?status=SUSPENDED">
              <Badge variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Suspended</Badge>
            </Link>
            {statusFilter && (
              <Link href="/admin/subscriptions" className="text-xs text-gray-500 hover:underline ml-2">Clear</Link>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Billing Cycle</th>
                <th className="px-6 py-3">Next Bill Date</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-purple-600 hover:underline">
                    <Link href={`/admin/tenants/${sub.tenant.id}`}>
                      {sub.tenant.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {sub.plan.name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                        sub.status === 'ACTIVE' ? 'default' :
                        sub.status === 'TRIAL' ? 'secondary' :
                        sub.status === 'PAST_DUE' || sub.status === 'SUSPENDED' ? 'destructive' : 'outline'
                      }>
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {sub.plan.billingInterval.toLowerCase()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {sub.endDate ? format(new Date(sub.endDate), 'MMM d, yyyy') : '-'}
                  </td>
                </tr>
              ))}
              
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
