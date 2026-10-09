'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createInvoiceAction } from '@/app/dashboard/billing/actions';
import { validateOfferAction } from '@/app/dashboard/offers/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  appointmentId: z.string().optional(),
  discount: z.coerce.number().min(0, 'Discount must be positive').default(0),
  offerId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    serviceId: z.string().optional(),
    productId: z.string().optional(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1').int(),
    discount: z.coerce.number().min(0, 'Item discount must be positive').default(0)
  })).min(1, 'Add at least one item')
}).refine(data => data.items.every(item => item.serviceId || item.productId), {
  message: "Each item must have a service or a product selected",
  path: ["items"]
});

export function InvoiceForm({
  customers,
  services,
  appointments,
  offers = [],
  products = [],
  defaultCustomerId,
  defaultAppointmentId
}: {
  customers: any[];
  services: any[];
  appointments: any[];
  offers?: any[];
  products?: any[];
  defaultCustomerId?: string;
  defaultAppointmentId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: defaultCustomerId || '',
      appointmentId: defaultAppointmentId || '',
      discount: 0,
      offerId: '',
      couponCode: '',
      notes: '',
      items: [{ serviceId: '', productId: '', quantity: 1, discount: 0 }]
    } as z.infer<typeof formSchema>
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const [validatedOffer, setValidatedOffer] = useState<{ discountAmount: number, message?: string } | null>(null);

  const watchedItems = watch('items') as { serviceId?: string, productId?: string, quantity: number, discount: number }[];
  const globalDiscount = watch('discount') || 0;
  const selectedCustomerId = watch('customerId');
  const selectedAppointmentId = watch('appointmentId');
  const selectedOfferId = watch('offerId');
  const enteredCouponCode = watch('couponCode');

  // Handle appointment selection auto-fill
  useEffect(() => {
    if (selectedAppointmentId) {
      const appt = appointments.find(a => a.id === selectedAppointmentId);
      if (appt) {
        if (!selectedCustomerId || selectedCustomerId !== appt.customerId) {
          setValue('customerId', appt.customerId);
        }
        // Auto-add the service from appointment if items list is empty or has only empty placeholders
        if (watchedItems.length === 1 && !watchedItems[0].serviceId) {
          setValue('items.0.serviceId', appt.serviceId);
        }
      }
    }
  }, [selectedAppointmentId, appointments, setValue, selectedCustomerId, watchedItems]);

  // Client-side calculations (preview only)
  const calculationPreview = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    watchedItems.forEach(item => {
      let price = 0;
      let taxPct = 0;

      if (item.serviceId && item.quantity > 0) {
        const service = services.find(s => s.id === item.serviceId);
        if (service) {
          price = Number(service.price);
          taxPct = Number(service.taxPercent);
        }
      } else if (item.productId && item.quantity > 0) {
        const product = products?.find(p => p.id === item.productId);
        if (product) {
          price = Number(product.sellingPrice);
          taxPct = Number(product.taxPercentage);
        }
      }

      if (price > 0 && item.quantity > 0) {
        const itemDiscount = Number(item.discount) || 0;
        const lineTotalBeforeDiscount = price * item.quantity;
        const lineTaxable = Math.max(0, lineTotalBeforeDiscount - itemDiscount);
        const lineTax = lineTaxable * (taxPct / 100);
        
        subtotal += lineTotalBeforeDiscount;
        totalTax += lineTax;
      }
    });

    // If an offer is applied, it overrides global manual discount for the preview
    let validatedGlobalDiscount = Math.max(0, Math.min(subtotal, Number(globalDiscount) || 0));
    if (validatedOffer) {
      validatedGlobalDiscount = validatedOffer.discountAmount;
    }

    const finalTotal = Math.max(0, subtotal - validatedGlobalDiscount + totalTax);

    return {
      subtotal,
      totalTax,
      globalDiscount: validatedGlobalDiscount,
      finalTotal
    };
  }, [watchedItems, globalDiscount, services, validatedOffer]);

  const handleApplyOffer = async () => {
    if (!selectedOfferId && !enteredCouponCode) {
      setValidatedOffer(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await validateOfferAction({
        offerId: selectedOfferId || undefined,
        couponCode: enteredCouponCode || undefined,
        subtotal: calculationPreview.subtotal,
        items: watchedItems.map(item => {
          let price = 0;
          if (item.serviceId) {
            const service = services.find(s => s.id === item.serviceId);
            price = service ? Number(service.price) : 0;
          } else if (item.productId) {
            const product = products?.find(p => p.id === item.productId);
            price = product ? Number(product.sellingPrice) : 0;
          }
          return {
            serviceId: item.serviceId || '',
            productId: item.productId,
            totalBeforeDiscount: Math.max(0, (price * item.quantity) - (Number(item.discount) || 0))
          } as any;
        })
      });

      if (result.valid) {
        setValidatedOffer({ discountAmount: result.discountAmount, message: 'Offer applied successfully!' });
      } else {
        setValidatedOffer(null);
        setError(result.message || 'Invalid offer');
      }
    } catch (err: any) {
      setValidatedOffer(null);
      setError(err.message || 'Error validating offer');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await createInvoiceAction(data);
        
      if (res.error) {
        setError(res.error);
      } else if (res.invoiceId) {
        router.push(`/dashboard/billing/${res.invoiceId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select onValueChange={(v) => setValue('customerId', v as string)} value={selectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.mobile})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Link Appointment (Optional)</Label>
                  <Select onValueChange={(v) => setValue('appointmentId', v === 'NONE' ? undefined : (v as string))} value={selectedAppointmentId || 'NONE'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {appointments
                        .filter(a => !selectedCustomerId || a.customerId === selectedCustomerId)
                        .map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {new Date(a.appointmentDate).toLocaleDateString()} - {services.find(s => s.id === a.serviceId)?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items (Services & Products)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ serviceId: '', productId: '', quantity: 1, discount: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-md relative">
                  {fields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-2 text-red-500"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <Label>Item</Label>
                    <Select 
                      onValueChange={(v) => {
                        const val = (v as string) || '';
                        if (val.startsWith('S:')) {
                          setValue(`items.${index}.serviceId` as any, val.replace('S:', ''));
                          setValue(`items.${index}.productId` as any, '');
                        } else if (val.startsWith('P:')) {
                          setValue(`items.${index}.productId` as any, val.replace('P:', ''));
                          setValue(`items.${index}.serviceId` as any, '');
                        }
                      }} 
                      value={
                        watchedItems[index]?.serviceId ? `S:${watchedItems[index].serviceId}` : 
                        watchedItems[index]?.productId ? `P:${watchedItems[index].productId}` : ''
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Service or Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length > 0 && <SelectItem value="header-services" disabled className="font-bold text-muted-foreground border-b rounded-none py-2">Services</SelectItem>}
                        {services.map(s => (
                          <SelectItem key={`S:${s.id}`} value={`S:${s.id}`}>{s.name} (₹{s.price})</SelectItem>
                        ))}
                        {products && products.length > 0 && <SelectItem value="header-products" disabled className="font-bold text-muted-foreground border-b border-t rounded-none py-2 mt-1">Retail Products</SelectItem>}
                        {products?.map(p => (
                          <SelectItem key={`P:${p.id}`} value={`P:${p.id}`}>{p.name} (₹{p.sellingPrice})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.serviceId && !watchedItems[index]?.productId && <p className="text-sm text-red-500">Please select an item</p>}
                  </div>

                  <div className="w-24 space-y-2">
                    <Label>Qty</Label>
                    <Input type="number" min="1" {...register(`items.${index}.quantity`)} />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label>Discount (₹)</Label>
                    <Input type="number" min="0" step="0.01" {...register(`items.${index}.discount`)} />
                  </div>
                  
                  <div className="w-32 space-y-2 pt-8 text-right font-medium">
                    {(() => {
                      const wItem = watchedItems[index];
                      let price = 0;
                      if (wItem?.serviceId) {
                        const s = services.find(srv => srv.id === wItem.serviceId);
                        if (s) price = Number(s.price);
                      } else if (wItem?.productId) {
                        const p = products?.find(prod => prod.id === wItem.productId);
                        if (p) price = Number(p.sellingPrice);
                      }
                      
                      const q = Number(wItem?.quantity) || 0;
                      const d = Number(wItem?.discount) || 0;
                      return `₹${Math.max(0, (price * q) - d).toFixed(2)}`;
                    })()}
                  </div>
                </div>
              ))}
              {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Offers & Additional Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Select Active Offer</Label>
                  <Select 
                    onValueChange={(v) => { setValue('offerId', v === 'NONE' ? '' : (v as string)); setValue('couponCode', ''); setValidatedOffer(null); }} 
                    value={selectedOfferId || 'NONE'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an offer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {offers.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Or Enter Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. BIRTHDAY30" 
                      {...register('couponCode')} 
                      onChange={(e) => {
                        setValue('couponCode', e.target.value);
                        setValue('offerId', '');
                        setValidatedOffer(null);
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={handleApplyOffer} disabled={loading}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>

              {validatedOffer?.message && (
                <p className="text-sm text-green-600 font-medium">{validatedOffer.message}</p>
              )}

              <div className="space-y-2 mt-4">
                <Label>Notes (Optional)</Label>
                <Textarea {...register('notes')} placeholder="Add notes for the customer..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Calculation Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{calculationPreview.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span>{validatedOffer ? 'Offer Discount' : 'Manual Global Discount'}</span>
                  {validatedOffer ? (
                    <span className="text-green-600 font-medium">- ₹{validatedOffer.discountAmount.toFixed(2)}</span>
                  ) : (
                    <div className="w-24">
                      <Input type="number" min="0" step="0.01" className="h-8 text-right" {...register('discount')} />
                    </div>
                  )}
                </div>
                {errors.discount && !validatedOffer && <p className="text-sm text-red-500 text-right">{errors.discount.message}</p>}
              </div>

              <div className="flex justify-between text-sm">
                <span>Estimated Tax</span>
                <span>₹{calculationPreview.totalTax.toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{calculationPreview.finalTotal.toFixed(2)}</span>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Note: This is a preview. Final calculations are processed securely on the server.
              </p>

              <Button type="submit" className="w-full mt-6" disabled={loading || watchedItems.length === 0 || !watchedItems[0].serviceId}>
                {loading ? 'Generating...' : 'Create Draft Invoice'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
