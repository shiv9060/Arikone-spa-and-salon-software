import { requirePermission } from '@/lib/auth/auth-utils';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { ExpenseForm } from '@/components/expenses/expense-form';

export const metadata = {
  title: 'New Expense | Arikone',
};

export default async function NewExpensePage() {
  const session = await requirePermission('EXPENSES_CREATE');

  const categories = await prisma.expenseCategory.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { name: 'asc' }
  });

  if (categories.length === 0) {
    return (
      <DashboardPage title="New Expense" backButton href="/dashboard/expenses">
        <div className="bg-white rounded-lg border p-8 text-center max-w-2xl mx-auto mt-8">
          <h3 className="text-lg font-medium text-gray-900">No expense categories found</h3>
          <p className="mt-2 text-gray-500">You need to create at least one active expense category before you can record expenses.</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="New Expense" backButton href="/dashboard/expenses">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <ExpenseForm categories={categories} />
        </div>
      </div>
    </DashboardPage>
  );
}
