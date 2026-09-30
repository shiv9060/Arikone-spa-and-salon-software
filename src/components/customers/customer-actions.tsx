'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { archiveCustomerAction, restoreCustomerAction } from '@/app/dashboard/customers/actions';
import { AlertTriangle, Archive, ArchiveRestore } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CustomerActions({ customer, userRole }: { customer: any /* eslint-disable-line @typescript-eslint/no-explicit-any */; userRole: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = async () => {
    setLoading(true);
    try {
      const res = customer.isActive 
        ? await archiveCustomerAction(customer.id)
        : await restoreCustomerAction(customer.id);
        
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: `Customer successfully ${customer.isActive ? 'archived' : 'restored'}.` });
        setOpen(false);
        router.refresh();
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      toast({ title: 'Error', description: 'Failed to perform action', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error Radix UI asChild typing issue */}
      <DialogTrigger asChild>
        <Button variant={customer.isActive ? 'destructive' : 'default'}>
          {customer.isActive ? (
            <><Archive className="mr-2 h-4 w-4" /> Archive</>
          ) : (
            <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {customer.isActive ? 'Archive Customer?' : 'Restore Customer?'}
          </DialogTitle>
          <DialogDescription>
            {customer.isActive 
              ? 'Archiving this customer will hide them from the active list, but all historical records (appointments, invoices) will be preserved.' 
              : 'Restoring this customer will make them active again.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant={customer.isActive ? 'destructive' : 'default'} onClick={handleAction} disabled={loading}>
            {loading ? 'Processing...' : (customer.isActive ? 'Archive' : 'Restore')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
