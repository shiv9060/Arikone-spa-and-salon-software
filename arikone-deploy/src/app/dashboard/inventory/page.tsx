import { getSession } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PackageSearch, FolderTree, Truck, ShoppingCart, Activity } from 'lucide-react';
import Link from 'next/link';
import { DashboardPage } from '@/components/layout/dashboard-page';
import prisma from '@/lib/db/prisma';

export const metadata = {
  title: 'Inventory | Arikone',
};

export default async function InventoryPage() {
  const session = await requirePermission('INVENTORY_VIEW');

  // Quick stats
  const [totalProducts, activeSuppliers, allTrackedProducts] = await Promise.all([
    prisma.product.count({ where: { tenantId: session.tenantId, isActive: true } }),
    prisma.supplier.count({ where: { tenantId: session.tenantId, isActive: true } }),
    prisma.product.findMany({ 
      where: { tenantId: session.tenantId, isActive: true, trackInventory: true },
      select: { currentStock: true, minimumStockLevel: true }
    })
  ]);

  const lowStockProducts = allTrackedProducts.filter(p => Number(p.currentStock) <= Number(p.minimumStockLevel)).length;

  const cards = [
    {
      title: 'Products',
      description: 'Manage retail & professional products',
      icon: <PackageSearch className="w-8 h-8 text-blue-500" />,
      href: '/dashboard/inventory/products',
      stat: `${totalProducts} Active`,
    },
    {
      title: 'Categories',
      description: 'Organize your products',
      icon: <FolderTree className="w-8 h-8 text-green-500" />,
      href: '/dashboard/inventory/categories',
      stat: 'View All',
    },
    {
      title: 'Suppliers',
      description: 'Manage vendors & suppliers',
      icon: <Truck className="w-8 h-8 text-orange-500" />,
      href: '/dashboard/inventory/suppliers',
      stat: `${activeSuppliers} Active`,
    },
    {
      title: 'Purchases',
      description: 'Record stock intakes',
      icon: <ShoppingCart className="w-8 h-8 text-purple-500" />,
      href: '/dashboard/inventory/purchases',
      stat: 'View History',
    },
    {
      title: 'Stock Movements',
      description: 'Track all inventory changes',
      icon: <Activity className="w-8 h-8 text-red-500" />,
      href: '/dashboard/inventory/movements',
      stat: 'Audit Trail',
    }
  ];

  return (
    <DashboardPage title="Inventory Management">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <PackageSearch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card className={lowStockProducts > 0 ? "border-red-200 bg-red-50/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">Products below minimum level</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliers}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Modules</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    {card.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">{card.stat}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardPage>
  );
}
