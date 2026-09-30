import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Edit, ListPlus } from 'lucide-react';
import { ProductDialog } from '@/components/inventory/product-dialog';
import { ProductAdjustDialog } from '@/components/inventory/product-adjust-dialog';
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
  title: 'Products | Arikone',
};

export default async function ProductsPage() {
  const session = await requirePermission('INVENTORY_VIEW');
  const canEdit = hasPermission(session.role as any, 'INVENTORY_UPDATE');
  const canAdjust = hasPermission(session.role as any, 'INVENTORY_ADJUST');

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: session.tenantId },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.productCategory.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    })
  ]);

  return (
    <DashboardPage
      title="Products"
      action={
        canEdit && (
          <ProductDialog categories={categories}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </Button>
          </ProductDialog>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canAdjust) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const stock = Number(product.currentStock);
                const min = Number(product.minimumStockLevel);
                const isLowStock = product.trackInventory && stock <= min;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                      {!product.trackInventory && (
                        <span className="block text-xs text-muted-foreground font-normal">Not tracked</span>
                      )}
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell className="text-right">₹{Number(product.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {product.trackInventory ? (
                        <div className="flex flex-col items-end">
                          <span className={isLowStock ? 'text-red-600 font-bold' : ''}>
                            {stock} {product.unit}
                          </span>
                          {isLowStock && <span className="text-[10px] text-red-500 uppercase">Low Stock</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {(canEdit || canAdjust) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canAdjust && product.trackInventory && (
                            <ProductAdjustDialog product={product}>
                              <Button variant="outline" size="sm" title="Adjust Stock">
                                <ListPlus className="w-4 h-4" />
                              </Button>
                            </ProductAdjustDialog>
                          )}
                          {canEdit && (
                            <ProductDialog product={product} categories={categories}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </ProductDialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardPage>
  );
}
