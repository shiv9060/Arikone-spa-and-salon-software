'use client';

import { Badge } from '@/components/ui/badge';
import { CategoryDialog } from './category-dialog';
import { Button } from '@/components/ui/button';
import { deactivateCategoryAction } from '@/app/dashboard/services/categories/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function CategoryTable({ categories, userRole }: { categories: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */; userRole: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  const canEdit = ['OWNER', 'MANAGER'].includes(userRole);
  
  const handleDeactivate = async (categoryId: string) => {
    if (!confirm('Are you sure you want to deactivate this category? New services cannot be added to it.')) return;
    
    setLoading(categoryId);
    try {
      const result = await deactivateCategoryAction(categoryId);
      if (result?.success) {
        toast({ title: 'Success', description: 'Category deactivated.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to deactivate.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {categories.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                No categories found.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {category.description || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {category._count?.services || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {category.sortOrder}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    {canEdit && <CategoryDialog mode="edit" category={category} />}
                    {canEdit && category.isActive && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeactivate(category.id)}
                        disabled={loading === category.id}
                      >
                        {loading === category.id ? '...' : 'Deactivate'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
