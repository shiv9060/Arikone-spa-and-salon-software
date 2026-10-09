import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaffReport, DateRange } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";
import { BarTrendChart } from "@/components/reports/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export async function StaffTab({ tenantId, dateRange, canViewFinancials }: { tenantId: string, dateRange: DateRange, canViewFinancials: boolean }) {
  const staffData = await getStaffReport(tenantId, dateRange);

  const sortedByAppointments = [...staffData].sort((a, b) => b.completed - a.completed);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance (Completed Appointments)</CardTitle>
        </CardHeader>
        <CardContent>
          <BarTrendChart 
            data={sortedByAppointments.slice(0, 10)} 
            xKey="name" 
            yKey="completed" 
            color="#f59e0b"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead className="text-right">Total Appointments</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Cancelled</TableHead>
                <TableHead className="text-right">No Show</TableHead>
                {canViewFinancials && (
                  <TableHead className="text-right">Revenue Generated</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewFinancials ? 6 : 5} className="text-center py-4 text-muted-foreground">
                    No staff data found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                sortedByAppointments.map(staff => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell className="text-right">{staff.appointments}</TableCell>
                    <TableCell className="text-right">{staff.completed}</TableCell>
                    <TableCell className="text-right text-destructive">{staff.cancelled}</TableCell>
                    <TableCell className="text-right text-destructive">{staff.noShow}</TableCell>
                    {canViewFinancials && (
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(staff.revenue)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
