import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { CategoryDialog } from '@/components/inventory/category-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Product Categories | Arikone',
};

export default async function CategoriesPage() {
  const session = await requirePermission('INVENTORY_VIEW');
  const canEdit = hasPermission(session.role as any, 'INVENTORY_UPDATE');

  const categories = await prisma.productCategory.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <DashboardPage
      title="Product Categories"
      action={
        canEdit && (
          <CategoryDialog>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Category
            </Button>
          </CategoryDialog>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <CategoryDialog category={category}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </CategoryDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardPage>
  );
}
