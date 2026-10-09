import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { CustomerForm } from '@/components/customers/customer-form';

export default async function NewCustomerPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'CUSTOMERS_CREATE')) {
    redirect('/dashboard/customers');
  }

  return (
    <div className="space-y-6">
      <CustomerForm mode="create" />
    </div>
  );
}
