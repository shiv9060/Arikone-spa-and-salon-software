import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PurchaseActions } from '@/components/inventory/purchase-actions';

export const metadata = {
  title: 'Purchases | Arikone',
};

export default async function PurchasesPage() {
  const session = await requirePermission('INVENTORY_VIEW');
  const canManage = hasPermission(session.role as any, 'INVENTORY_PURCHASE');

  const purchases = await prisma.inventoryPurchase.findMany({
    where: { tenantId: session.tenantId },
    include: { 
      supplier: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { purchaseDate: 'desc' },
  });

  return (
    <DashboardPage
      title="Purchases"
      action={
        canManage && (
          <Link href="/dashboard/inventory/purchases/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </Link>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total (₹)</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No purchases found.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                  <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>{purchase.supplier.name}</TableCell>
                  <TableCell>{purchase._count.items}</TableCell>
                  <TableCell className="text-right font-medium">{Number(purchase.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        purchase.status === 'RECEIVED' ? 'default' : 
                        purchase.status === 'CANCELLED' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <PurchaseActions purchase={purchase} />
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
