'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCategory, updateCategory } from '@/app/dashboard/inventory/categories/actions';
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

import { ProductCategory } from '@prisma/client';
import { toast } from 'sonner';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
    </Button>
  );
}

export function CategoryDialog({
  children,
  category,
}: {
  children: React.ReactNode;
  category?: ProductCategory;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!category;

  async function action(formData: FormData) {
    try {
      if (isEdit) {
        await updateCategory(category.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
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
          <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g., Shampoos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description || ''}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              className="w-4 h-4"
              defaultChecked={category?.isActive ?? true}
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
