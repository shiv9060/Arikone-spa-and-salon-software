import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerReport, getAppointmentReport, getRevenueReport, DateRange } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";

export async function SummaryTab({ tenantId, dateRange, canViewFinancials }: { tenantId: string, dateRange: DateRange, canViewFinancials: boolean }) {
  const [customerData, appointmentData, revenueData] = await Promise.all([
    getCustomerReport(tenantId, dateRange, 1, 1),
    getAppointmentReport(tenantId, dateRange),
    canViewFinancials ? getRevenueReport(tenantId, dateRange) : null
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {canViewFinancials && revenueData && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData.metrics.revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Payment collected in period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(revenueData.metrics.outstanding)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total pending payments</p>
            </CardContent>
          </Card>
        </>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointmentData.metrics.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointmentData.metrics.completed}</div>
          <p className="text-xs text-muted-foreground mt-1">{appointmentData.metrics.completionRate.toFixed(1)}% completion rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerData.metrics.newCustomers}</div>
        </CardContent>
      </Card>
    </div>
  );
}
