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
import { createRecurringExpense } from '@/app/dashboard/expenses/recurring/actions';
import { toast } from 'sonner';
import { RecurringExpenseFrequency, PaymentMode } from '@prisma/client';

const formSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  frequency: z.nativeEnum(RecurringExpenseFrequency),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  paymentMode: z.nativeEnum(PaymentMode).optional(),
  vendorName: z.string().optional(),
  status: z.boolean().default(true),
});

type RecurringExpenseFormValues = z.infer<typeof formSchema>;

export function RecurringExpenseForm({ categories }: { categories: { id: string, name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: RecurringExpenseFrequency.MONTHLY,
      startDate: new Date().toISOString().split('T')[0],
      status: true,
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

      await createRecurringExpense(formData);
      toast.success('Recurring expense configured successfully');
      router.push('/dashboard/expenses/recurring');
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
          <Input placeholder="e.g. Monthly Rent" {...register('title')} />
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
          <Label>Frequency <span className="text-red-500">*</span></Label>
          <Select 
            value={watch('frequency')} 
            onValueChange={(val) => setValue('frequency', val as RecurringExpenseFrequency)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Start Date <span className="text-red-500">*</span></Label>
          <Input type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-sm text-red-500">{String(errors.startDate.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <Input type="date" {...register('endDate')} />
        </div>

        <div className="space-y-2">
          <Label>Payment Mode (Default)</Label>
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
          <Input placeholder="e.g. Landlord Name" {...register('vendorName')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea placeholder="Additional details..." {...register('description')} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Configure Recurring Expense'}
        </Button>
      </div>
    </form>
  );
}
