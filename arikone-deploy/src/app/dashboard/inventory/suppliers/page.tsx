import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { hasPermission } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { SupplierDialog } from '@/components/inventory/supplier-dialog';
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
  title: 'Suppliers | Arikone',
};

export default async function SuppliersPage() {
  const session = await requirePermission('SUPPLIERS_VIEW');
  const canEdit = hasPermission(session.role as any, 'SUPPLIERS_MANAGE');

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: 'asc' },
  });

  return (
    <DashboardPage
      title="Suppliers"
      action={
        canEdit && (
          <SupplierDialog>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Supplier
            </Button>
          </SupplierDialog>
        )
      }
    >
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplier.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {supplier.mobile && <div>{supplier.mobile}</div>}
                      {supplier.email && <div className="text-muted-foreground">{supplier.email}</div>}
                      {!supplier.mobile && !supplier.email && '-'}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.gstin || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <SupplierDialog supplier={supplier}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </SupplierDialog>
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
