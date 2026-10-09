'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateTenantStatusAction } from './actions';

export function TenantActions({ tenant }: { tenant: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    if (status === 'SUSPENDED') {
      if (!confirm('Are you sure you want to suspend this tenant? Users will no longer be able to access the application.')) return;
    } else if (status === 'CANCELLED') {
      if (!confirm('Are you sure you want to cancel this tenant?')) return;
    }

    setLoading(true);
    try {
      await updateTenantStatusAction(tenant.id, status);
      router.refresh();
    } catch (e) {
      alert('Failed to update status');
    }
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-4 py-2 border rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 text-sm">
        {loading ? 'Updating...' : 'Manage'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {tenant.status !== 'ACTIVE' && (
          <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')} className="text-green-600">
            Activate
          </DropdownMenuItem>
        )}
        {tenant.status !== 'SUSPENDED' && tenant.status !== 'CANCELLED' && (
          <DropdownMenuItem onClick={() => handleStatusChange('SUSPENDED')} className="text-orange-600">
            Suspend
          </DropdownMenuItem>
        )}
        {tenant.status !== 'CANCELLED' && (
          <DropdownMenuItem onClick={() => handleStatusChange('CANCELLED')} className="text-red-600">
            Cancel Account
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
