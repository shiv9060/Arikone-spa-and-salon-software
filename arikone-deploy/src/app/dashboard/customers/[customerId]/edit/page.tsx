import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getCustomerById } from '@/services/customer.service';
import { CustomerForm } from '@/components/customers/customer-form';

export default async function EditCustomerPage(props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'CUSTOMERS_UPDATE')) {
    redirect('/dashboard/customers');
  }

  const customer = await getCustomerById(session.tenantId, params.customerId);

  if (!customer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerForm mode="edit" customer={customer} />
    </div>
  );
}
