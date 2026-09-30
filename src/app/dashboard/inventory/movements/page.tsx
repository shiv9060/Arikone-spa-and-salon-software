import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const metadata = {
  title: 'Stock Movements | Arikone',
};

export default async function StockMovementsPage() {
  const session = await requirePermission('INVENTORY_VIEW');

  const movements = await prisma.stockMovement.findMany({
    where: { tenantId: session.tenantId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to recent 100 for performance
  });

  return (
    <DashboardPage title="Stock Movements">
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty Change</TableHead>
              <TableHead className="text-right">Stock After</TableHead>
              <TableHead>Reason / Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No stock movements recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => {
                const isIncrease = Number(movement.stockAfter) >= Number(movement.stockBefore);
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {format(movement.createdAt, 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.product.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.type}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncrease ? '+' : '-'}{Number(movement.quantity)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {Number(movement.stockAfter)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.reason || '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardPage>
  );
}
