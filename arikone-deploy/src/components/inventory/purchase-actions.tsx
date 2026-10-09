'use client';

import { useState } from 'react';
import { actionReceivePurchase, actionCancelPurchase } from '@/app/dashboard/inventory/purchases/actions';
import { Button } from '@/components/ui/button';
import { PurchaseStatus, InventoryPurchase } from '@prisma/client';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

export function PurchaseActions({ purchase }: { purchase: InventoryPurchase }) {
  const [loading, setLoading] = useState(false);

  const handleReceive = async () => {
    if (!confirm(`Are you sure you want to mark PO #${purchase.purchaseNumber} as received? This will increase stock levels.`)) return;
    
    setLoading(true);
    try {
      await actionReceivePurchase(purchase.id);
      toast.success('Purchase received and stock updated');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel PO #${purchase.purchaseNumber}? If already received, this will reverse stock levels.`)) return;
    
    setLoading(true);
    try {
      await actionCancelPurchase(purchase.id);
      toast.success('Purchase cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (purchase.status === PurchaseStatus.CANCELLED) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <DropdownMenu>
      {/* @ts-expect-error asChild type issue */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {purchase.status === PurchaseStatus.DRAFT && (
          <DropdownMenuItem onClick={handleReceive} className="text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Received
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCancel} className="text-red-600">
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Purchase
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
