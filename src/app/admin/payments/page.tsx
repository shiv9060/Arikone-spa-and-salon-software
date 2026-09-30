import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status;
  
  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: true,
      subscription: { include: { plan: true } }
    },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-gray-500">View platform-wide subscription payments.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex gap-2">
          <Link href="/admin/payments">
            <Badge variant={!statusFilter ? 'default' : 'outline'} className="cursor-pointer">All</Badge>
          </Link>
          <Link href="/admin/payments?status=PAID">
            <Badge variant={statusFilter === 'PAID' ? 'default' : 'outline'} className="cursor-pointer">Paid</Badge>
          </Link>
          <Link href="/admin/payments?status=PENDING">
            <Badge variant={statusFilter === 'PENDING' ? 'default' : 'outline'} className="cursor-pointer">Pending</Badge>
          </Link>
          <Link href="/admin/payments?status=FAILED">
            <Badge variant={statusFilter === 'FAILED' ? 'default' : 'outline'} className="cursor-pointer">Failed</Badge>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Provider Txn ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-purple-600 hover:underline">
                    <Link href={`/admin/tenants/${tx.tenant.id}`}>
                      {tx.tenant.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {tx.currency} {tx.amount.toString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                        tx.status === 'PAID' ? 'default' :
                        tx.status === 'FAILED' ? 'destructive' :
                        'outline'
                      }>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {tx.providerTransactionId}
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payments found.
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
