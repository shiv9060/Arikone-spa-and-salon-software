import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getInvoices } from '@/services/billing.service';
import { BillingTable } from '@/components/billing/billing-table';
import { BillingFilters } from '@/components/billing/billing-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function BillingPage(props: { searchParams: Promise<{ page?: string; search?: string; status?: string; paymentStatus?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'BILLING_VIEW')) {
    redirect('/dashboard');
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || '';
  const status = searchParams.status || 'ALL';
  const paymentStatus = searchParams.paymentStatus || 'ALL';

  const invoicesRes = await getInvoices(session.tenantId, {
    page,
    limit: 20,
    search,
    status,
    paymentStatus
  });

  const canCreate = hasPermission(session.role, 'BILLING_CREATE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and financial records.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/billing/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Bill
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <BillingFilters 
          defaultSearch={search} 
          defaultStatus={status} 
          defaultPaymentStatus={paymentStatus}
        />
        
        <BillingTable 
          invoices={invoicesRes.data} 
          pagination={invoicesRes.pagination} 
          userRole={session.role} 
        />
      </div>
    </div>
  );
}
