'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { finalizeInvoiceAction, cancelInvoiceAction } from '@/app/dashboard/billing/actions';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle } from 'lucide-react';

export function InvoiceActions({ invoiceId, actionType }: { invoiceId: string, actionType: 'finalize' | 'cancel' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (actionType === 'finalize') {
        await finalizeInvoiceAction(invoiceId);
      } else {
        await cancelInvoiceAction(invoiceId);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        {actionType === 'finalize' ? (
          <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <CheckCircle className="mr-2 h-4 w-4" /> Finalize Invoice
          </div>
        ) : (
          <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
            <XCircle className="mr-2 h-4 w-4" /> Cancel Invoice
          </div>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionType === 'finalize' ? 'Finalize Invoice?' : 'Cancel Invoice?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {actionType === 'finalize' 
              ? 'After finalization, invoice items and financial values cannot be freely edited. Ensure all services are added.' 
              : 'This action will cancel the invoice. Payments cannot be recorded against cancelled invoices.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Close</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={loading} className={actionType === 'cancel' ? 'bg-red-600' : ''}>
            {loading ? 'Processing...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
