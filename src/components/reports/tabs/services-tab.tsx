import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceReport, DateRange } from "@/services/report.service";
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

export async function ServicesTab({ tenantId, dateRange }: { tenantId: string, dateRange: DateRange }) {
  const servicesData = await getServiceReport(tenantId, dateRange);

  // Sort by revenue descending
  const sortedByRevenue = [...servicesData].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Services by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <BarTrendChart 
            data={sortedByRevenue.slice(0, 10)} 
            xKey="name" 
            yKey="revenue" 
            color="#8b5cf6"
            yFormatter={(val) => formatCurrency(val)} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg. Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByRevenue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No services found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                sortedByRevenue.map(service => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell className="text-right">{service.bookings}</TableCell>
                    <TableCell className="text-right">{service.completed}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(service.revenue)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(service.averageRevenue)}</TableCell>
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
