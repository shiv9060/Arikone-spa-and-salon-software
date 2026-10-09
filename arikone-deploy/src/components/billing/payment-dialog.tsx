'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { recordPaymentAction } from '@/app/dashboard/billing/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Payment amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export function PaymentDialog({ invoice }: { invoice: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const outstanding = Math.max(0, Number(invoice.total) - totalPaid);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: outstanding,
      paymentMode: 'CASH',
      referenceNumber: '',
      notes: ''
    } as z.infer<typeof formSchema>
  });

  const onSubmit = async (data: any) => {
    if (data.amount > outstanding) {
      setError('Payment exceeds the outstanding invoice balance.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await recordPaymentAction(invoice.id, data);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        reset();
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-primary-foreground hover:bg-green-700 h-10 px-4 py-2">
          <CreditCard className="mr-2 h-4 w-4" /> Record Payment
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for Invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-md flex justify-between font-medium">
            <span>Outstanding Balance</span>
            <span className="text-orange-600">₹{outstanding.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" step="0.01" max={outstanding} {...register('amount')} />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select onValueChange={(v) => setValue('paymentMode', v as any)} defaultValue="CASH">
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMode && <p className="text-sm text-red-500">{errors.paymentMode.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Reference Number (Optional)</Label>
            <Input {...register('referenceNumber')} placeholder="Transaction ID, Check No..." />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea {...register('notes')} placeholder="Add payment notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Recording...' : 'Submit Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
