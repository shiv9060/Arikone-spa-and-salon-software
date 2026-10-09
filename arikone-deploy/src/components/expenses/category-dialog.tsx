'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createExpenseCategory, updateExpenseCategory } from '@/app/dashboard/expenses/categories/actions';
import { toast } from 'sonner';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface ExpenseCategoryDialogProps {
  children: React.ReactNode;
  category?: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
}

export function ExpenseCategoryDialog({ children, category }: ExpenseCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      isActive: category?.isActive ?? true,
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('isActive', data.isActive.toString());

      if (category) {
        await updateExpenseCategory(category.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createExpenseCategory(formData);
        toast.success('Category created successfully');
      }
      setOpen(false);
      if (!category) reset();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update expense category details' : 'Create a new expense category'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Rent, Salary, Utilities"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-500">{String(errors.name.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              {...register('isActive')}
            />
            <Label htmlFor="isActive">Active (can be used in new expenses)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
