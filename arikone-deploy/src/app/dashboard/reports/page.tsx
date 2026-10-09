import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { ReportFilters } from '@/components/reports/report-filters';
import { getTenantDateRange } from '@/lib/date-utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

// Import tab contents (we will create these)
import { SummaryTab } from '@/components/reports/tabs/summary-tab';
import { RevenueTab } from '@/components/reports/tabs/revenue-tab';
import { CustomersTab } from '@/components/reports/tabs/customers-tab';
import { AppointmentsTab } from '@/components/reports/tabs/appointments-tab';
import { ServicesTab } from '@/components/reports/tabs/services-tab';
import { StaffTab } from '@/components/reports/tabs/staff-tab';
import { ProfitLossTab } from '@/components/reports/tabs/profit-loss-tab';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default async function ReportsPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'REPORTS_VIEW')) {
    redirect('/dashboard');
  }

  const canViewFinancials = hasPermission(session.role, 'REPORTS_FINANCIAL');
  const canViewProfitLoss = hasPermission(session.role, 'PROFIT_LOSS_VIEW');
  const canExport = hasPermission(session.role, 'REPORTS_EXPORT');

  const activeTab = searchParams.tab || 'summary';
  const period = searchParams.period || 'this_month';
  const customStart = searchParams.start;
  const customEnd = searchParams.end;

  const dateRange = getTenantDateRange(period, ((session as any).tenantTimezone || 'Asia/Kolkata') as string, customStart, customEnd);

  // Generate URL for exporting
  const exportParams = new URLSearchParams(searchParams as any);
  exportParams.set('tab', activeTab);
  exportParams.set('period', period);
  if (customStart) exportParams.set('start', customStart);
  if (customEnd) exportParams.set('end', customEnd);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Understand your salon's business performance.</p>
        </div>
        
        {canExport && (
          <div className="flex gap-2">
            <Link href={`/api/reports/export/pdf?${exportParams.toString()}`} target="_blank">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
            </Link>
            <Link href={`/api/reports/export/excel?${exportParams.toString()}`} target="_blank">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
            </Link>
            <Link href={`/api/reports/export/csv?${exportParams.toString()}`} target="_blank">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            </Link>
          </div>
        )}
      </div>

      <ReportFilters defaultPeriod={period} />

      <Tabs value={activeTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'summary' }).toString()}`}>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </Link>
          {canViewFinancials && (
            <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'revenue' }).toString()}`}>
              <TabsTrigger value="revenue">Revenue & Billing</TabsTrigger>
            </Link>
          )}
          <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'customers' }).toString()}`}>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </Link>
          <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'appointments' }).toString()}`}>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </Link>
          {canViewFinancials && (
            <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'services' }).toString()}`}>
              <TabsTrigger value="services">Services</TabsTrigger>
            </Link>
          )}
          <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'staff' }).toString()}`}>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </Link>
          {canViewProfitLoss && (
            <Link href={`?${new URLSearchParams({ ...(searchParams as any), tab: 'profit-loss' }).toString()}`}>
              <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            </Link>
          )}
        </TabsList>
      </Tabs>

      <div className="pt-4">
        {activeTab === 'summary' && (
          <SummaryTab tenantId={session.tenantId} dateRange={dateRange} canViewFinancials={canViewFinancials} />
        )}
        {activeTab === 'revenue' && canViewFinancials && (
          <RevenueTab tenantId={session.tenantId} dateRange={dateRange} />
        )}
        {activeTab === 'customers' && (
          <CustomersTab tenantId={session.tenantId} dateRange={dateRange} page={Number(searchParams.page) || 1} />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsTab tenantId={session.tenantId} dateRange={dateRange} />
        )}
        {activeTab === 'services' && canViewFinancials && (
          <ServicesTab tenantId={session.tenantId} dateRange={dateRange} />
        )}
        {activeTab === 'staff' && (
          <StaffTab tenantId={session.tenantId} dateRange={dateRange} canViewFinancials={canViewFinancials} />
        )}
        {activeTab === 'profit-loss' && canViewProfitLoss && (
          <ProfitLossTab tenantId={session.tenantId} dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}
