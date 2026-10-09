import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBillingReport, getRevenueReport, getPaymentModeReport, DateRange } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";
import { RevenueTrendChart, PaymentModesChart } from "@/components/reports/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export async function RevenueTab({ tenantId, dateRange }: { tenantId: string, dateRange: DateRange }) {
  const [billing, revenue, payments] = await Promise.all([
    getBillingReport(tenantId, dateRange),
    getRevenueReport(tenantId, dateRange),
    getPaymentModeReport(tenantId, dateRange)
  ]);

  const trendData = Object.entries(revenue.trend).map(([date, amount]) => ({
    date,
    amount
  })).sort((a, b) => a.date.localeCompare(b.date));

  const paymentModesData = Object.entries(payments).map(([name, data]) => ({
    name,
    value: data.amount
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billing.grossBilling)}</div>
            <p className="text-xs text-muted-foreground mt-1">Before discounts & tax</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billing.discounts)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billing.netBilling)}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalized invoices total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.metrics.revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Actual payments received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Payment Modes</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentModesChart data={paymentModesData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Created (Draft)</TableCell>
                <TableCell>{billing.created}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Finalized</TableCell>
                <TableCell>{billing.finalized}</TableCell>
                <TableCell>{formatCurrency(billing.netBilling)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cancelled</TableCell>
                <TableCell>{billing.cancelled}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
