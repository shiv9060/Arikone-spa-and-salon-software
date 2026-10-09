import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Repeat } from 'lucide-react';
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
import { format } from 'date-fns';
import { RecurringExpenseStatusUpdater } from '@/components/expenses/recurring-expense-status-updater';

export const metadata = {
  title: 'Recurring Expenses | Arikone',
};

export default async function RecurringExpensesPage() {
  const session = await requirePermission('EXPENSES_VIEW');
  const canCreate = hasPermission(session.role as any, 'EXPENSES_CREATE');
  const canEdit = hasPermission(session.role as any, 'EXPENSES_UPDATE');

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { tenantId: session.tenantId },
    include: { category: true },
    orderBy: { nextDueDate: 'asc' },
  });

  return (
    <DashboardPage
      title="Recurring Expenses"
      backButton
      href="/dashboard/expenses"
      action={
        canCreate && (
          <Link href="/dashboard/expenses/recurring/new">
            <Button type="button">
              <Plus className="w-4 h-4 mr-2" />
              New Recurring Expense
            </Button>
          </Link>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No recurring expenses configured.
                </TableCell>
              </TableRow>
            )}
            {recurringExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell>{expense.category.name}</TableCell>
                <TableCell>₹{Number(expense.amount).toFixed(2)}</TableCell>
                <TableCell>{expense.frequency}</TableCell>
                <TableCell>{format(new Date(expense.nextDueDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={expense.status ? 'default' : 'secondary'}>
                    {expense.status ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canEdit && (
                    <RecurringExpenseStatusUpdater 
                      id={expense.id} 
                      status={expense.status}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardPage>
  );
}
