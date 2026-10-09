import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentReport, DateRange } from "@/services/report.service";
import { BarTrendChart } from "@/components/reports/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export async function AppointmentsTab({ tenantId, dateRange }: { tenantId: string, dateRange: DateRange }) {
  const { metrics, trend } = await getAppointmentReport(tenantId, dateRange);

  const trendData = Object.entries(trend).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.completionRate.toFixed(1)}% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.noShow}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Appointments Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarTrendChart data={trendData} xKey="date" yKey="count" />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Confirmed</TableCell>
                  <TableCell className="text-right">{metrics.confirmed}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Arrived</TableCell>
                  <TableCell className="text-right">{metrics.arrived}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Service Started</TableCell>
                  <TableCell className="text-right">{metrics.serviceStarted}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Completed</TableCell>
                  <TableCell className="text-right font-medium">{metrics.completed}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cancelled</TableCell>
                  <TableCell className="text-right text-destructive">{metrics.cancelled}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>No Show</TableCell>
                  <TableCell className="text-right text-destructive">{metrics.noShow}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
