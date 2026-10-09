import { requirePermission } from '@/lib/auth/auth-utils';
import { getServices } from '@/services/service.service';
import { getCategories } from '@/services/service-category.service';
import { ServiceTable } from '@/components/services/service-table';
import { ServiceDialog } from '@/components/services/service-dialog';
import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { FolderTree } from 'lucide-react';

export default async function ServicesPage() {
  const user = await requirePermission('SERVICES_VIEW');
  
  const [services, categories, products] = await Promise.all([
    getServices(user.tenantId),
    getCategories(user.tenantId),
    prisma.product.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: 'asc' }
    })
  ]);
  
  const canCreate = ['OWNER', 'MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your service menu, pricing, and duration.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link href="/dashboard/services/categories">
            <Button variant="outline">
              <FolderTree className="-ml-1 mr-2 h-4 w-4" />
              Manage Categories
            </Button>
          </Link>
          {canCreate && <ServiceDialog mode="create" categories={categories} />}
        </div>
      </div>
      
      <ServiceTable services={services} categories={categories} products={products} userRole={user.role} />
    </div>
  );
}
