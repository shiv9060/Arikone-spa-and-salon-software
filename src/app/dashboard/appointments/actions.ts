'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { 
  createAppointment, 
  updateAppointment, 
  updateAppointmentStatus 
} from '@/services/appointment.service';
import { AppointmentStatus } from '@prisma/client';

const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  serviceId: z.string().min(1, 'Service is required'),
  staffId: z.string().min(1, 'Staff is required'),
  appointmentDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional()
});

// Helper to parse date and time correctly treating them as local tenant time
// The client will pass "2023-10-15" and "10:30"
function parseTenantDateTime(dateStr: string, timeStr: string) {
  // Creating a UTC date object representing the exact local time the user intended.
  // Note: For a robust timezone solution, we'd use date-fns-tz. 
  // Here we combine them into an ISO string.
  return new Date(`${dateStr}T${timeStr}:00`);
}

export async function createAppointmentAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'APPOINTMENTS_CREATE')) {
      return { error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    const parsed = appointmentSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { customerId, serviceId, staffId, appointmentDate, startTime, endTime, notes } = parsed.data;

    const startDateTime = parseTenantDateTime(appointmentDate, startTime);
    const endDateTime = parseTenantDateTime(appointmentDate, endTime);
    const dateOnly = new Date(`${appointmentDate}T00:00:00`);

    const appointment = await createAppointment(session.tenantId, session.userId, {
      customerId,
      serviceId,
      staffId,
      appointmentDate: dateOnly,
      startTime: startDateTime,
      endTime: endDateTime,
      notes
    });

    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, appointmentId: appointment.id };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to create appointment' };
  }
}

export async function updateAppointmentAction(appointmentId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    if (!hasPermission(session.role, 'APPOINTMENTS_UPDATE')) {
      return { error: 'Unauthorized' };
    }

    const data = Object.fromEntries(formData);
    const parsed = appointmentSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { customerId, serviceId, staffId, appointmentDate, startTime, endTime, notes } = parsed.data;

    const startDateTime = parseTenantDateTime(appointmentDate, startTime);
    const endDateTime = parseTenantDateTime(appointmentDate, endTime);
    const dateOnly = new Date(`${appointmentDate}T00:00:00`);

    await updateAppointment(session.tenantId, session.userId, appointmentId, {
      customerId,
      serviceId,
      staffId,
      appointmentDate: dateOnly,
      startTime: startDateTime,
      endTime: endDateTime,
      notes
    });

    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true, appointmentId };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to update appointment' };
  }
}

export async function updateAppointmentStatusAction(
  appointmentId: string, 
  status: AppointmentStatus, 
  cancellationReason?: string
) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    const requiredPermission = status === 'CANCELLED' ? 'APPOINTMENTS_CANCEL' : 'APPOINTMENTS_UPDATE';
    if (!hasPermission(session.role, requiredPermission as any)) {
      return { error: 'Unauthorized' };
    }

    await updateAppointmentStatus(session.tenantId, session.userId, appointmentId, status, cancellationReason);
    
    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Failed to update status' };
  }
}
