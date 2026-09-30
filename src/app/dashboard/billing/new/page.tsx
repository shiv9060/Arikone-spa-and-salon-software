import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getCustomers } from '@/services/customer.service';
import { getServices } from '@/services/service.service';
import { getAppointments } from '@/services/appointment.service';
import { InvoiceForm } from '@/components/billing/invoice-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewInvoicePage(props: { searchParams: Promise<{ appointmentId?: string, customerId?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'BILLING_CREATE')) {
    redirect('/dashboard/billing');
  }

  // Load prerequisites
  const [customersRes, servicesRes, appointmentsRes, offersRes, productsRes] = await Promise.all([
    getCustomers(session.tenantId, { limit: 1000, status: 'ACTIVE' }),
    getServices(session.tenantId, undefined, true),
    getAppointments(session.tenantId, { limit: 1000, status: 'COMPLETED' }),
    import('@/services/offer.service').then(m => m.getOffers(session.tenantId, { status: 'ACTIVE', limit: 100 })),
    import('@/lib/db/prisma').then(m => m.default.product.findMany({ where: { tenantId: session.tenantId, isActive: true }, orderBy: { name: 'asc' } }))
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/billing" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Draft a new bill for a customer.</p>
        </div>
      </div>

      <InvoiceForm 
        customers={customersRes.data} 
        services={servicesRes} 
        products={productsRes}
        appointments={appointmentsRes.data}
        offers={offersRes.data}
        defaultAppointmentId={searchParams.appointmentId}
        defaultCustomerId={searchParams.customerId}
      />
    </div>
  );
}
