import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExpenseCategoryDialog } from '@/components/expenses/category-dialog';

export const metadata = {
  title: 'Expense Categories | Arikone',
};

export default async function ExpenseCategoriesPage() {
  const session = await requirePermission('EXPENSES_SETTINGS');
  const canEdit = hasPermission(session.role as any, 'EXPENSES_SETTINGS');

  const categories = await prisma.expenseCategory.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { expenses: true }
      }
    }
  });

  return (
    <DashboardPage
      title="Expense Categories"
      action={
        canEdit && (
          <ExpenseCategoryDialog>
            <Button type="button">
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </Button>
          </ExpenseCategoryDialog>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No expense categories found.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-gray-500">{category.description || '-'}</TableCell>
                <TableCell>{category._count.expenses}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canEdit && (
                    <ExpenseCategoryDialog category={category}>
                      <Button variant="ghost" size="sm" type="button">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </ExpenseCategoryDialog>
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
