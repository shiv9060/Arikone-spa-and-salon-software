import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';
import { AppointmentStatus } from '@prisma/client';
import { queueAppointmentMessage } from '@/lib/whatsapp/appointments';
import { consumeServiceProducts } from './inventory.service';
import { queueFeedbackRequest } from './feedback.service';

export async function checkAppointmentConflict(
  tenantId: string,
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
) {
  const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {
    tenantId,
    staffId,
    status: {
      notIn: ['CANCELLED', 'NO_SHOW']
    },
    // Overlap logic: existing appointment starts before this one ends, AND ends after this one starts
    startTime: {
      lt: endTime
    },
    endTime: {
      gt: startTime
    }
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflict = await prisma.appointment.findFirst({
    where
  });

  return !!conflict;
}

export async function getAppointments(
  tenantId: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    status?: string;
    search?: string;
    customerId?: string;
  } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 100; // allow bigger limits for calendar

  const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { tenantId };

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.startDate && options.endDate) {
    where.startTime = {
      gte: options.startDate,
      lte: options.endDate
    };
  } else if (options.startDate) {
    where.startTime = { gte: options.startDate };
  } else if (options.endDate) {
    where.startTime = { lte: options.endDate };
  }

  if (options.staffId && options.staffId !== 'ALL') {
    where.staffId = options.staffId;
  }

  if (options.status && options.status !== 'ALL') {
    where.status = options.status;
  }

  if (options.search) {
    const search = options.search.trim();
    where.OR = [
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { mobile: { contains: search } } },
      { service: { name: { contains: search, mode: 'insensitive' } } },
      { staff: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { id: true, name: true, mobile: true, email: true } },
        service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        staff: { select: { id: true, name: true, designation: true } }
      }
    }),
    prisma.appointment.count({ where })
  ]);

  return {
    data: appointments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getAppointmentById(tenantId: string, appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      customer: true,
      service: true,
      staff: true
    }
  });

  if (!appointment || appointment.tenantId !== tenantId) {
    return null;
  }

  return appointment;
}

export async function createAppointment(
  tenantId: string,
  userId: string,
  data: {
    customerId: string;
    serviceId: string;
    staffId: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
  }
) {
  // Validate relations
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer || customer.tenantId !== tenantId) throw new Error('Invalid customer');
  if (!customer.isActive) throw new Error('Archived customer cannot be used for new appointment');

  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service || service.tenantId !== tenantId) throw new Error('Invalid service');
  if (!service.isActive) throw new Error('Inactive service cannot be used');

  const staff = await prisma.staff.findUnique({ where: { id: data.staffId } });
  if (!staff || staff.tenantId !== tenantId) throw new Error('Invalid staff');
  if (staff.status !== 'ACTIVE') throw new Error('Inactive staff cannot be assigned');

  if (data.endTime <= data.startTime) {
    throw new Error('End time must be after start time');
  }

  const hasConflict = await checkAppointmentConflict(tenantId, data.staffId, data.startTime, data.endTime);
  if (hasConflict) {
    throw new Error('That staff member is already booked during this time.');
  }

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      customerId: data.customerId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      status: 'NEW'
    },
    include: {
      customer: true
    }
  });

  await logAudit(tenantId, userId, 'APPOINTMENT_CREATED', 'Appointment', appointment.id, `Appointment created for ${appointment.customer.name}`);

  return appointment;
}

export async function updateAppointment(
  tenantId: string,
  userId: string,
  appointmentId: string,
  data: {
    customerId: string;
    serviceId: string;
    staffId: string;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    notes?: string | null;
  }
) {
  const existing = await getAppointmentById(tenantId, appointmentId);
  if (!existing) throw new Error('Appointment not found');

  if (data.customerId !== existing.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer || customer.tenantId !== tenantId || !customer.isActive) throw new Error('Invalid customer');
  }

  if (data.serviceId !== existing.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || service.tenantId !== tenantId || !service.isActive) throw new Error('Invalid service');
  }

  if (data.staffId !== existing.staffId) {
    const staff = await prisma.staff.findUnique({ where: { id: data.staffId } });
    if (!staff || staff.tenantId !== tenantId || staff.status !== 'ACTIVE') throw new Error('Invalid staff');
  }

  if (data.endTime <= data.startTime) {
    throw new Error('End time must be after start time');
  }

  const hasConflict = await checkAppointmentConflict(tenantId, data.staffId, data.startTime, data.endTime, appointmentId);
  if (hasConflict) {
    throw new Error('That staff member is already booked during this time.');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: { customer: true }
  });

  await logAudit(tenantId, userId, 'APPOINTMENT_UPDATED', 'Appointment', appointmentId, `Appointment updated for ${updated.customer.name}`);

  return updated;
}



export async function updateAppointmentStatus(
  tenantId: string,
  userId: string,
  appointmentId: string,
  status: AppointmentStatus,
  cancellationReason?: string
) {
  const existing = await getAppointmentById(tenantId, appointmentId);
  if (!existing) throw new Error('Appointment not found');

  const updateData: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { status };
  
  if (status === 'CANCELLED') {
    updateData.cancellationReason = cancellationReason || null;
  }
  
  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
    include: { customer: true }
  });

  await logAudit(tenantId, userId, `APPOINTMENT_${status}`, 'Appointment', appointmentId, `Appointment for ${updated.customer.name} marked as ${status}`);

  if (status === 'CONFIRMED' || status === 'CANCELLED') {
    // Queue message without blocking the response
    queueAppointmentMessage(tenantId, appointmentId, status).catch((err) => {
      console.error('Failed to queue appointment message:', err);
    });
  }
  
  if (status === 'COMPLETED') {
    // Consume inventory if configured, without blocking the response heavily
    consumeServiceProducts(tenantId, appointmentId, updated.serviceId, userId).catch((err) => {
      console.error('Failed to consume service products for appointment:', err);
    });
    
    // Queue feedback request
    queueFeedbackRequest(tenantId, appointmentId, userId).catch((err) => {
      console.error('Failed to queue feedback request:', err);
    });
  }

  return updated;
}
