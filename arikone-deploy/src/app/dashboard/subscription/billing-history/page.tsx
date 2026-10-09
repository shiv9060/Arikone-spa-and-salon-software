import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function BillingHistoryPage() {
  const session = await getSession();
  if (!session || !session.tenantId) redirect('/login');

  const transactions = await prisma.paymentTransaction.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
    include: { subscription: { include: { plan: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing History</h1>
          <p className="text-gray-500">View your past subscription payments and invoices.</p>
        </div>
        <Link href="/dashboard/subscription" className="text-sm text-purple-600 hover:underline">
          &larr; Back to Subscription
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4">
                  {tx.subscription?.plan?.name ? `Subscription to ${tx.subscription.plan.name}` : 'Subscription Payment'}
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
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  {tx.providerTransactionId}
                </td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No billing history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
