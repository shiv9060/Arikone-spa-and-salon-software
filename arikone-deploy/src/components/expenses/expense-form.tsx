'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createExpense } from '@/app/dashboard/expenses/actions';
import { toast } from 'sonner';
import { ExpenseStatus, PaymentMode } from '@prisma/client';

const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  expenseDate: z.string(),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  vendorName: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z.nativeEnum(ExpenseStatus),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({ categories }: { categories: { id: string, name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().split('T')[0],
      status: ExpenseStatus.PENDING,
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      await createExpense(formData);
      toast.success('Expense recorded successfully');
      router.push('/dashboard/expenses');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Title <span className="text-red-500">*</span></Label>
          <Input placeholder="What is this expense for?" {...register('title')} />
          {errors.title && <p className="text-sm text-red-500">{String(errors.title.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label>Category <span className="text-red-500">*</span></Label>
          <Select onValueChange={(val) => setValue('categoryId', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-sm text-red-500">{String(errors.categoryId.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label>Amount <span className="text-red-500">*</span></Label>
          <Input type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="text-sm text-red-500">{String(errors.amount.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label>Date <span className="text-red-500">*</span></Label>
          <Input type="date" {...register('expenseDate')} />
          {errors.expenseDate && <p className="text-sm text-red-500">{String(errors.expenseDate.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label>Status <span className="text-red-500">*</span></Label>
          <Select 
            value={watch('status')} 
            onValueChange={(val) => setValue('status', val as ExpenseStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending Approval</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment Mode</Label>
          <Select onValueChange={(val) => setValue('paymentMode', val as PaymentMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Payment Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vendor Name</Label>
          <Input placeholder="e.g. Electricity Board" {...register('vendorName')} />
        </div>

        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input placeholder="Receipt/Transaction ID" {...register('referenceNumber')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Additional details..." {...register('description')} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Record Expense'}
        </Button>
      </div>
    </form>
  );
}
