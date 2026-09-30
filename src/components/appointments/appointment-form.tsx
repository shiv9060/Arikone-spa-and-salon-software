'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createAppointmentAction, updateAppointmentAction } from '@/app/dashboard/appointments/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  serviceId: z.string().min(1, 'Service is required'),
  staffId: z.string().min(1, 'Staff is required'),
  appointmentDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional()
});

export function AppointmentForm({ 
  customers, 
  services, 
  staff, 
  appointment,
  mode = 'create'
}: { 
  customers: any[]; 
  services: any[]; 
  staff: any[];
  appointment?: any;
  mode?: 'create' | 'edit';
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial values formatting
  let defaultDate = '';
  let defaultStartTime = '';
  let defaultEndTime = '';

  if (appointment) {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    // Format to local date string yyyy-mm-dd
    const pad = (n: number) => n.toString().padStart(2, '0');
    defaultDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    defaultStartTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    defaultEndTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useHookForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: appointment?.customerId || '',
      serviceId: appointment?.serviceId || '',
      staffId: appointment?.staffId || '',
      appointmentDate: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      notes: appointment?.notes || ''
    }
  });

  const selectedServiceId = watch('serviceId');
  const startTime = watch('startTime');

  // Auto-calculate end time if service and start time are set
  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>, isStart: boolean) => {
    const val = e.target.value;
    if (isStart) {
      setValue('startTime', val);
      if (selectedServiceId && val) {
        const service = services.find(s => s.id === selectedServiceId);
        if (service && service.durationMinutes) {
          const [h, m] = val.split(':').map(Number);
          const end = new Date();
          end.setHours(h, m + service.durationMinutes, 0);
          const pad = (n: number) => n.toString().padStart(2, '0');
          setValue('endTime', `${pad(end.getHours())}:${pad(end.getMinutes())}`);
        }
      }
    } else {
      setValue('endTime', val);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v.toString());
      });

      const res = mode === 'create' 
        ? await createAppointmentAction(formData)
        : await updateAppointmentAction(appointment.id, formData);
        
      if (res.error) {
        setError(res.error);
      } else {
        router.push(`/dashboard/appointments/${res.appointmentId || appointment.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select onValueChange={(v) => setValue('customerId', v)} defaultValue={appointment?.customerId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.mobile})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Service</Label>
              <Select onValueChange={(v) => setValue('serviceId', v)} defaultValue={appointment?.serviceId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && <p className="text-sm text-red-500">{errors.serviceId.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Staff</Label>
              <Select onValueChange={(v) => setValue('staffId', v)} defaultValue={appointment?.staffId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.designation || 'Staff'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.staffId && <p className="text-sm text-red-500">{errors.staffId.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...register('appointmentDate')} />
              {errors.appointmentDate && <p className="text-sm text-red-500">{errors.appointmentDate.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" {...register('startTime')} onChange={(e) => onTimeChange(e, true)} />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" {...register('endTime')} onChange={(e) => onTimeChange(e, false)} />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Optional notes for this appointment..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Appointment' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
