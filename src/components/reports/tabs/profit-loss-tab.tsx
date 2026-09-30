import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBillingReport, getRevenueReport, DateRange } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/db/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseStatus } from '@prisma/client';

export async function ProfitLossTab({ tenantId, dateRange }: { tenantId: string, dateRange: DateRange }) {
  // 1. Get Revenue (Accrual / Cash)
  const [billing, revenue] = await Promise.all([
    getBillingReport(tenantId, dateRange),
    getRevenueReport(tenantId, dateRange),
  ]);

  // 2. Get Operating Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      status: ExpenseStatus.PAID,
      expenseDate: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      }
    },
    include: {
      category: true,
    }
  });

  const totalOperatingExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Group by category
  const expenseByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category.name;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);

  const expenseBreakdown = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount
  })).sort((a, b) => b.amount - a.amount);

  // 3. Calculate Profit & Loss (Accrual basis: Net Billing - Expenses. Cash basis: Collected - Expenses)
  const netRevenueAccrual = billing.netBilling;
  const netRevenueCash = revenue.metrics.revenue;

  const netProfitAccrual = netRevenueAccrual - totalOperatingExpenses;
  const netProfitCash = netRevenueCash - totalOperatingExpenses;

  const profitMarginAccrual = netRevenueAccrual > 0 ? (netProfitAccrual / netRevenueAccrual) * 100 : 0;
  const profitMarginCash = netRevenueCash > 0 ? (netProfitCash / netRevenueCash) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue (Accrual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netRevenueAccrual)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total value of finalized invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOperatingExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total PAID expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (Accrual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfitAccrual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfitAccrual)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitMarginAccrual.toFixed(1)}% Profit Margin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Collected (Cash In)</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(netRevenueCash)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Operating Expenses (Cash Out)</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(totalOperatingExpenses)}</TableCell>
                </TableRow>
                <TableRow className="bg-gray-50/50">
                  <TableCell className="font-bold text-lg">Net Cash Flow</TableCell>
                  <TableCell className={`text-right font-bold text-lg ${netProfitCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfitCash)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              Cash flow is calculated based on actual payments collected minus paid expenses, providing insight into liquidity.
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Operating Expenses Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseBreakdown.map(item => (
                    <TableRow key={item.category}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-right">
                        {((item.amount / totalOperatingExpenses) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalOperatingExpenses)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No paid operating expenses found for this period.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
