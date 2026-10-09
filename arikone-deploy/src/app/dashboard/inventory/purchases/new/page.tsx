import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { DashboardPage } from '@/components/layout/dashboard-page';
import { PurchaseForm } from '@/components/inventory/purchase-form';

export const metadata = {
  title: 'New Purchase | Arikone',
};

export default async function NewPurchasePage() {
  const session = await requirePermission('INVENTORY_PURCHASE');

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (suppliers.length === 0) {
    return (
      <DashboardPage title="New Purchase Order">
        <div className="bg-white p-8 rounded-lg border text-center">
          <h3 className="text-lg font-medium mb-2">No Suppliers Found</h3>
          <p className="text-muted-foreground mb-4">You need to create at least one supplier before you can create a purchase order.</p>
        </div>
      </DashboardPage>
    );
  }

  if (products.length === 0) {
    return (
      <DashboardPage title="New Purchase Order">
        <div className="bg-white p-8 rounded-lg border text-center">
          <h3 className="text-lg font-medium mb-2">No Products Found</h3>
          <p className="text-muted-foreground mb-4">You need to create at least one product before you can create a purchase order.</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="New Purchase Order" backButton href="/dashboard/inventory/purchases">
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <PurchaseForm suppliers={suppliers} products={products} />
      </div>
    </DashboardPage>
  );
}
