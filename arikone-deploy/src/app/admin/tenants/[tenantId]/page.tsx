import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { TenantActions } from './tenant-actions';

export default async function AdminTenantDetailsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: true,
      users: {
        where: { role: 'OWNER' }
      }
    }
  });

  if (!tenant) redirect('/admin/tenants');

  const [
    userCount,
    customerCount,
    appointmentCount,
    invoiceCount
  ] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.appointment.count({ where: { tenantId } }),
    prisma.invoice.count({ where: { tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-gray-500">/{tenant.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={
            tenant.status === 'ACTIVE' ? 'default' :
            tenant.status === 'TRIAL' ? 'secondary' :
            tenant.status === 'SUSPENDED' ? 'destructive' : 'outline'
          } className="text-sm px-3 py-1">
            {tenant.status}
          </Badge>
          <TenantActions tenant={tenant} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Business Name</span>
              <span className="font-medium">{tenant.name}</span>
              
              <span className="text-gray-500">Business Type</span>
              <span className="font-medium capitalize">{tenant.businessType || '-'}</span>
              
              <span className="text-gray-500">Created Date</span>
              <span className="font-medium">{format(new Date(tenant.createdAt), 'MMM d, yyyy')}</span>
              
              <span className="text-gray-500">Country</span>
              <span className="font-medium">{tenant.country}</span>
              
              <span className="text-gray-500">Currency</span>
              <span className="font-medium">{tenant.currency}</span>
              
              <span className="text-gray-500">Timezone</span>
              <span className="font-medium">{tenant.timezone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{tenant.email || '-'}</span>
              
              <span className="text-gray-500">Phone</span>
              <span className="font-medium">{tenant.phone || '-'}</span>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2 text-sm">Active Owners</h4>
              {tenant.users.length > 0 ? (
                <div className="space-y-2">
                  {tenant.users.map(u => (
                    <div key={u.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                      </div>
                      <Badge variant={u.isActive ? "outline" : "secondary"}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No owners registered yet. Waiting for invitation acceptance.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{userCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Users</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{customerCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Customers</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{appointmentCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Appointments</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{invoiceCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Current Plan</span>
              <span className="font-medium">{tenant.plan?.name || 'No Plan'}</span>
              
              {tenant.status === 'TRIAL' && (
                <>
                  <span className="text-gray-500">Trial End Date</span>
                  <span className="font-medium text-orange-600">
                    {tenant.trialEndDate ? format(new Date(tenant.trialEndDate), 'MMM d, yyyy') : '-'}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
