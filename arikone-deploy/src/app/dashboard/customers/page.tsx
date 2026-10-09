import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getCustomers } from '@/services/customer.service';
import { hasPermission } from '@/lib/auth/permissions';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerFilters } from '@/components/customers/customer-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function CustomersPage(props: { searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'CUSTOMERS_VIEW')) {
    redirect('/dashboard');
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || '';
  const status = (searchParams.status as 'ALL' | 'ACTIVE' | 'ARCHIVED') || 'ACTIVE';
  const sort = (searchParams.sort as 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC') || 'NEWEST';

  const { data: customers, pagination } = await getCustomers(session.tenantId, {
    page,
    limit: 20,
    search,
    status,
    sort
  });

  const canCreate = hasPermission(session.role, 'CUSTOMERS_CREATE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your salon&apos;s customer relationships and history.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/customers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Customer
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <CustomerFilters 
          defaultSearch={search} 
          defaultStatus={status} 
          defaultSort={sort} 
        />
        <CustomerTable 
          customers={customers} 
          pagination={pagination} 
          userRole={session.role} 
        />
      </div>
    </div>
  );
}
