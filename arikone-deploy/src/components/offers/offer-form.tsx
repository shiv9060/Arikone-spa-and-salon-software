'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createOfferAction, updateOfferAction } from '@/app/dashboard/offers/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  discountType: z.enum(['PERCENT', 'AMOUNT']),
  discountValue: z.coerce.number().min(0.01, 'Discount must be greater than 0'),
  minimumBill: z.coerce.number().min(0).optional().or(z.literal('')),
  maximumDiscount: z.coerce.number().min(0).optional().or(z.literal('')),
  couponCode: z.string().optional(),
  applicableServices: z.enum(['ALL', 'SPECIFIC']),
  serviceIds: z.array(z.string()).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().min(1).optional().or(z.literal('')),
}).refine((data) => {
  if (data.applicableServices === 'SPECIFIC' && (!data.serviceIds || data.serviceIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Please select at least one service',
  path: ['serviceIds'],
}).refine((data) => {
  if (new Date(data.startDate) > new Date(data.endDate)) {
    return false;
  }
  return true;
}, {
  message: 'Start date cannot be after end date',
  path: ['endDate'],
}).refine((data) => {
  if (data.discountType === 'PERCENT' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Discount percentage cannot exceed 100',
  path: ['discountValue'],
});

export function OfferForm({
  services,
  initialData
}: {
  services: any[];
  initialData?: any;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      discountType: initialData?.discountPercent ? 'PERCENT' : 'AMOUNT',
      discountValue: initialData?.discountPercent 
        ? Number(initialData.discountPercent) 
        : initialData?.discountAmount 
          ? Number(initialData.discountAmount) 
          : 0,
      minimumBill: initialData?.minimumBill ? Number(initialData.minimumBill) : '',
      maximumDiscount: initialData?.maximumDiscount ? Number(initialData.maximumDiscount) : '',
      couponCode: initialData?.couponCode || '',
      applicableServices: initialData?.applicableServices || 'ALL',
      serviceIds: initialData?.offerServices ? initialData.offerServices.map((os: any) => os.serviceId) : [],
      startDate: initialData?.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: initialData?.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd') : format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      isActive: initialData ? initialData.isActive : true,
      usageLimit: initialData?.usageLimit ? initialData.usageLimit : '',
    }
  });

  const applicableServices = watch('applicableServices');
  const discountType = watch('discountType');
  const selectedServiceIds = watch('serviceIds') || [];

  const handleServiceToggle = (id: string, checked: boolean) => {
    if (checked) {
      setValue('serviceIds', [...selectedServiceIds, id]);
    } else {
      setValue('serviceIds', selectedServiceIds.filter((sId: string) => sId !== id));
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        discountPercent: data.discountType === 'PERCENT' ? Number(data.discountValue) : undefined,
        discountAmount: data.discountType === 'AMOUNT' ? Number(data.discountValue) : undefined,
        minimumBill: data.minimumBill ? Number(data.minimumBill) : undefined,
        maximumDiscount: data.maximumDiscount ? Number(data.maximumDiscount) : undefined,
        couponCode: data.couponCode || undefined,
        applicableServices: data.applicableServices,
        serviceIds: data.applicableServices === 'SPECIFIC' ? data.serviceIds : undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      };

      if (initialData) {
        await updateOfferAction(initialData.id, payload);
      } else {
        await createOfferAction(payload);
      }

      router.push('/dashboard/offers');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg border">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>Offer Name *</Label>
          <Input {...register('name')} placeholder="e.g. Summer Special 20% Off" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea {...register('description')} placeholder="Brief description of the offer..." />
        </div>

        <div className="space-y-2">
          <Label>Discount Type *</Label>
          <Select 
            onValueChange={(v) => setValue('discountType', v as any)} 
            value={discountType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Percentage (%)</SelectItem>
              <SelectItem value="AMOUNT">Flat Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Discount Value *</Label>
          <Input type="number" step="0.01" {...register('discountValue')} placeholder={discountType === 'PERCENT' ? 'e.g. 15' : 'e.g. 500'} />
          {errors.discountValue && <p className="text-sm text-red-500">{errors.discountValue.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Minimum Bill Amount (₹)</Label>
          <Input type="number" step="0.01" {...register('minimumBill')} placeholder="Optional" />
          {errors.minimumBill && <p className="text-sm text-red-500">{errors.minimumBill.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Maximum Discount Amount (₹)</Label>
          <Input type="number" step="0.01" {...register('maximumDiscount')} placeholder="Optional" disabled={discountType === 'AMOUNT'} />
          {errors.maximumDiscount && <p className="text-sm text-red-500">{errors.maximumDiscount.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Coupon Code (Optional)</Label>
          <Input {...register('couponCode')} placeholder="e.g. WELCOME10" className="uppercase" />
          {errors.couponCode && <p className="text-sm text-red-500">{errors.couponCode.message as string}</p>}
          <p className="text-xs text-muted-foreground">Leave blank if the offer can be selected manually without a code.</p>
        </div>

        <div className="space-y-2">
          <Label>Usage Limit (Optional)</Label>
          <Input type="number" {...register('usageLimit')} placeholder="Total number of times this can be used" />
        </div>

        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input type="date" {...register('startDate')} />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input type="date" {...register('endDate')} />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message as string}</p>}
        </div>

        <div className="space-y-4 md:col-span-2">
          <Label>Applicable Services *</Label>
          <Select 
            onValueChange={(v) => setValue('applicableServices', v as any)} 
            value={applicableServices}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select applicable services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Services</SelectItem>
              <SelectItem value="SPECIFIC">Specific Services Only</SelectItem>
            </SelectContent>
          </Select>

          {applicableServices === 'SPECIFIC' && (
            <div className="mt-4 border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
              {services.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id={`service-${service.id}`}
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <Label htmlFor={`service-${service.id}`} className="font-normal cursor-pointer">
                    {service.name} (₹{service.price})
                  </Label>
                </div>
              ))}
              {errors.serviceIds && <p className="text-sm text-red-500">{errors.serviceIds.message as string}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 md:col-span-2 mt-4">
          <input 
            type="checkbox"
            id="isActive" 
            checked={watch('isActive')}
            onChange={(e) => setValue('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (initialData ? 'Update Offer' : 'Create Offer')}</Button>
      </div>
    </form>
  );
}
