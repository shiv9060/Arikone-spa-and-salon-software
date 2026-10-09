'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProduct, updateProduct } from '@/app/dashboard/inventory/products/actions';
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
import { Product, ProductCategory, ProductUnit } from '@prisma/client';
import { toast } from 'sonner';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
    </Button>
  );
}

export function ProductDialog({
  children,
  product,
  categories,
}: {
  children: React.ReactNode;
  product?: Product;
  categories: ProductCategory[];
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!product;

  async function action(formData: FormData) {
    try {
      if (isEdit) {
        await updateProduct(product.id, formData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(formData);
        toast.success('Product created successfully');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" defaultValue={product?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select name="categoryId" defaultValue={product?.categoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" name="barcode" defaultValue={product?.barcode || ''} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={product?.description || ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select name="unit" defaultValue={product?.unit || 'PIECE'} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductUnit).map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxPercentage">Tax %</Label>
              <Input id="taxPercentage" name="taxPercentage" type="number" step="0.01" defaultValue={Number(product?.taxPercentage || 0)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={Number(product?.costPrice || 0)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={Number(product?.sellingPrice || 0)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumStockLevel">Minimum Stock Alert Level</Label>
              <Input id="minimumStockLevel" name="minimumStockLevel" type="number" step="0.01" defaultValue={Number(product?.minimumStockLevel || 0)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Target Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" step="0.01" defaultValue={Number(product?.reorderLevel || 0)} required />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4" id="isActive" name="isActive" defaultChecked={product?.isActive ?? true} value="true" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4" id="trackInventory" name="trackInventory" defaultChecked={product?.trackInventory ?? true} value="true" />
              <Label htmlFor="trackInventory">Track Inventory</Label>
            </div>
          </div>

          <div className="pt-4">
            <SubmitButton isEdit={isEdit} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
