'use client';

import { Badge } from '@/components/ui/badge';
import { ServiceDialog } from './service-dialog';
import { Button } from '@/components/ui/button';
import { deactivateServiceAction } from '@/app/dashboard/services/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

import { ServiceProductsDialog } from './service-products-dialog';

export function ServiceTable({ services, categories, products, userRole }: { services: any[]  ; categories: any[]  ; products: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */; userRole: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  const canEdit = ['OWNER', 'MANAGER'].includes(userRole);
  
  const handleDeactivate = async (serviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this service? It cannot be selected for new appointments or billing.')) return;
    
    setLoading(serviceId);
    try {
      const result = await deactivateServiceAction(serviceId);
      if (result?.success) {
        toast({ title: 'Success', description: 'Service deactivated.' });
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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {services.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                No services found.
              </td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{service.name}</div>
                  {service.description && (
                    <div className="text-xs text-gray-500 max-w-[200px] truncate">{service.description}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {service.category?.name || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {service.price?.toString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {service.durationMinutes} min
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {service.taxPercent?.toString()}%
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={service.isActive ? 'default' : 'secondary'}>
                    {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2 items-center">
                    {canEdit && <ServiceDialog mode="edit" service={service} categories={categories} />}
                    {canEdit && <ServiceProductsDialog service={service} products={products} />}
                    {canEdit && service.isActive && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeactivate(service.id)}
                        disabled={loading === service.id}
                      >
                        {loading === service.id ? '...' : 'Deactivate'}
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
