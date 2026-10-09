'use client';

import { useState } from 'react';
import { updateAppointmentStatusAction } from '@/app/dashboard/appointments/actions';
import { AppointmentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function AppointmentStatusActions({ appointment, userRole }: { appointment: any, userRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const updateStatus = async (status: AppointmentStatus, reason?: string) => {
    setLoading(true);
    await updateAppointmentStatusAction(appointment.id, status, reason);
    setLoading(false);
    setCancelDialogOpen(false);
    router.refresh();
  };

  const getPrimaryAction = () => {
    if (userRole === 'STAFF') return null;

    switch (appointment.status) {
      case 'NEW':
        return <Button disabled={loading} onClick={() => updateStatus('CONFIRMED')}>Confirm Appointment</Button>;
      case 'CONFIRMED':
        return <Button disabled={loading} onClick={() => updateStatus('ARRIVED')}>Mark Arrived</Button>;
      case 'ARRIVED':
        return <Button disabled={loading} onClick={() => updateStatus('SERVICE_STARTED')}>Start Service</Button>;
      case 'SERVICE_STARTED':
        return <Button disabled={loading} onClick={() => updateStatus('COMPLETED')}>Complete Service</Button>;
      case 'COMPLETED':
        return <Button disabled={loading} onClick={() => router.push(`/dashboard/billing/new?appointmentId=${appointment.id}`)}>Create Bill</Button>;
      default:
        return null;
    }
  };

  const canCancel = !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status) && userRole !== 'STAFF';

  return (
    <>
      <div className="flex items-center gap-2">
        {getPrimaryAction()}

        {canCancel && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'More Actions'} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCancelDialogOpen(true)} className="text-red-600">
                Cancel Appointment
              </DropdownMenuItem>
              {['NEW', 'CONFIRMED'].includes(appointment.status) && (
                <DropdownMenuItem onClick={() => updateStatus('NO_SHOW')}>
                  Mark as No-Show
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment for {appointment.customer.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cancellation Reason (Optional)</label>
              <Textarea 
                placeholder="Why is this appointment being cancelled?" 
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={loading}>Close</Button>
            <Button variant="destructive" onClick={() => updateStatus('CANCELLED', cancellationReason)} disabled={loading}>
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
