import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getPlatformMetrics } from '@/services/platform.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Receipt, UserCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const metrics = await getPlatformMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-gray-500">Overview of Arikone SaaS platform performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTenants}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs text-green-600 bg-green-50">{metrics.activeTenants} Active</Badge>
              <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">{metrics.trialTenants} Trial</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">SaaS users across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">End consumers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 mt-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Appointments</span>
                <span className="font-medium">{metrics.totalAppointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoices</span>
                <span className="font-medium">{metrics.totalInvoices}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentTenants.length === 0 ? (
              <p className="text-sm text-gray-500">No tenants created yet.</p>
            ) : (
              <div className="space-y-4">
                {metrics.recentTenants.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <Link href={`/admin/tenants/${t.id}`} className="font-medium text-purple-600 hover:underline">
                        {t.name}
                      </Link>
                      <div className="text-xs text-gray-500">/{t.slug}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        t.status === 'ACTIVE' ? 'default' :
                        t.status === 'TRIAL' ? 'secondary' :
                        t.status === 'SUSPENDED' ? 'destructive' : 'outline'
                      }>
                        {t.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">{format(new Date(t.createdAt), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t text-center">
              <Link href="/admin/tenants" className="text-sm text-purple-600 hover:underline">View All Tenants</Link>
            </div>
          </CardContent>
        </Card>

        {metrics.suspendedTenants > 0 && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 text-red-900 border-b border-red-100">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-red-600">{metrics.suspendedTenants}</div>
                <div>
                  <div className="font-medium text-gray-900">Suspended Tenants</div>
                  <p className="text-sm text-gray-500">Tenants suspended due to billing or compliance.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
