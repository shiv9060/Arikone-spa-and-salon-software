import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Check, X, FileText, Settings, List } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExpenseStatusUpdater } from '@/components/expenses/expense-status-updater';
import { format } from 'date-fns';

export const metadata = {
  title: 'Expenses | Arikone',
};

export default async function ExpensesPage() {
  const session = await requirePermission('EXPENSES_VIEW');
  const canCreate = hasPermission(session.role as any, 'EXPENSES_CREATE');
  const canApprove = hasPermission(session.role as any, 'EXPENSES_APPROVE');
  const canCancel = hasPermission(session.role as any, 'EXPENSES_CANCEL');
  const canManageSettings = hasPermission(session.role as any, 'EXPENSES_SETTINGS');

  const expenses = await prisma.expense.findMany({
    where: { tenantId: session.tenantId },
    include: { category: true },
    orderBy: { expenseDate: 'desc' },
  });

  const totalThisMonth = expenses
    .filter(e => new Date(e.expenseDate).getMonth() === new Date().getMonth())
    .filter(e => e.status !== 'CANCELLED')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <DashboardPage
      title="Expenses"
      action={
        <div className="flex gap-2">
          {canManageSettings && (
            <Link href="/dashboard/expenses/categories">
              <Button variant="outline" type="button">
                <Settings className="w-4 h-4 mr-2" />
                Categories
              </Button>
            </Link>
          )}
          {canCreate && (
            <Link href="/dashboard/expenses/new">
              <Button type="button">
                <Plus className="w-4 h-4 mr-2" />
                New Expense
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase">This Month</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">₹{totalThisMonth.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase">Pending Approval</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">
            {expenses.filter(e => e.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm font-medium text-gray-500 uppercase">Unpaid (Approved)</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {expenses.filter(e => e.status === 'APPROVED').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium text-indigo-600">{expense.expenseNumber}</TableCell>
                <TableCell>{format(new Date(expense.expenseDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{expense.category.name}</TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell>₹{Number(expense.amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={
                    expense.status === 'PAID' ? 'default' : 
                    expense.status === 'APPROVED' ? 'default' :
                    expense.status === 'CANCELLED' ? 'destructive' :
                    'secondary'
                  }>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ExpenseStatusUpdater 
                    expenseId={expense.id} 
                    status={expense.status}
                    canApprove={canApprove}
                    canCancel={canCancel}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardPage>
  );
}
