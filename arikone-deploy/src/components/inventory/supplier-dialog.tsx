'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createSupplier, updateSupplier } from '@/app/dashboard/inventory/suppliers/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { Supplier } from '@prisma/client';
import { toast } from 'sonner';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
    </Button>
  );
}

export function SupplierDialog({
  children,
  supplier,
}: {
  children: React.ReactNode;
  supplier?: Supplier;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!supplier;

  async function action(formData: FormData) {
    try {
      if (isEdit) {
        await updateSupplier(supplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await createSupplier(formData);
        toast.success('Supplier created successfully');
      }
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
          <DialogTitle>{isEdit ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={supplier?.name}
              placeholder="e.g., L'Oreal Professional"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                name="mobile"
                defaultValue={supplier?.mobile || ''}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={supplier?.email || ''}
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Tax ID)</Label>
            <Input
              id="gstin"
              name="gstin"
              defaultValue={supplier?.gstin || ''}
              placeholder="e.g., 22AAAAA0000A1Z5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={supplier?.address || ''}
              placeholder="Supplier address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={supplier?.notes || ''}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              className="w-4 h-4"
              defaultChecked={supplier?.isActive ?? true}
              value="true"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="pt-4">
            <SubmitButton isEdit={isEdit} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
