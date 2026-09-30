import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerReport, DateRange } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export async function CustomersTab({ tenantId, dateRange, page }: { tenantId: string, dateRange: DateRange, page: number }) {
  const { metrics, table } = await getCustomerReport(tenantId, dateRange, page, 50);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.archivedCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Total Visits</TableHead>
                <TableHead>Total Spending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No customers found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                table.data.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell>{customer.joinedDate.toLocaleDateString()}</TableCell>
                    <TableCell>{customer.totalVisits}</TableCell>
                    <TableCell>{formatCurrency(customer.totalSpending)}</TableCell>
                    <TableCell>{customer.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {table.pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
              <div>Page {table.pagination.page} of {table.pagination.totalPages}</div>
              <div className="flex gap-2">
                {/* Note: In a real app we'd use links with updated page params. Keeping simple here. */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
