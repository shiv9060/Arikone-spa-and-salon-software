'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { manualStockAdjustment } from '@/app/dashboard/inventory/products/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, StockMovementType } from '@prisma/client';
import { toast } from 'sonner';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Adjusting...' : 'Confirm Adjustment'}
    </Button>
  );
}

export function ProductAdjustDialog({
  children,
  product,
}: {
  children: React.ReactNode;
  product: Product;
}) {
  const [open, setOpen] = useState(false);

  const adjustStockWithId = manualStockAdjustment.bind(null, product.id);

  async function action(formData: FormData) {
    try {
      await adjustStockWithId(formData);
      toast.success('Stock adjusted successfully');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error asChild type issue */}
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          Current Stock: <span className="font-bold text-foreground">{Number(product.currentStock)}</span> {product.unit}
        </div>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Adjustment Type</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={StockMovementType.ADJUSTMENT_IN}>Add Stock (+)</SelectItem>
                <SelectItem value={StockMovementType.ADJUSTMENT_OUT}>Remove Stock (-)</SelectItem>
                <SelectItem value={StockMovementType.DAMAGE}>Damage / Spoilage (-)</SelectItem>
                <SelectItem value={StockMovementType.EXPIRED}>Expired (-)</SelectItem>
                <SelectItem value={StockMovementType.RETURN}>Return from Customer (+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Positive Number)</Label>
            <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Notes</Label>
            <Input id="reason" name="reason" placeholder="Optional notes" />
          </div>

          <div className="pt-4">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
