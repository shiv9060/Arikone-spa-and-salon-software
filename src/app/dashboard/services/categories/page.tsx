import { requirePermission } from '@/lib/auth/auth-utils';
import { getCategories } from '@/services/service-category.service';
import { CategoryTable } from '@/components/services/category-table';
import { CategoryDialog } from '@/components/services/category-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function CategoriesPage() {
  const user = await requirePermission('SERVICES_VIEW');
  const categories = await getCategories(user.tenantId);
  const canCreate = ['OWNER', 'MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard/services">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </Link>
      </div>
      
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your services into groups.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {canCreate && <CategoryDialog mode="create" />}
        </div>
      </div>
      
      <CategoryTable categories={categories} userRole={user.role} />
    </div>
  );
}
