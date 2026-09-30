'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toggleRecurringExpenseStatus } from '@/app/dashboard/expenses/recurring/actions';
import { toast } from 'sonner';

export function RecurringExpenseStatusUpdater({ 
  id, 
  status, 
}: { 
  id: string, 
  status: boolean,
}) {
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      await toggleRecurringExpenseStatus(id, status);
      toast.success(`Recurring expense ${!status ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={status ? 'destructive' : 'outline'} 
      size="sm" 
      onClick={toggleStatus} 
      disabled={loading}
      type="button"
    >
      {status ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
