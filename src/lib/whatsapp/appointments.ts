import prisma from "@/lib/db/prisma";
import { AppointmentStatus, WhatsAppMessageType } from "@prisma/client";
import { DEFAULT_TEMPLATES, compileTemplate } from "./templates";
import { format } from "date-fns";

export async function queueAppointmentMessage(
  tenantId: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  if (status !== AppointmentStatus.CONFIRMED && status !== AppointmentStatus.CANCELLED) {
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant) return;

  const settings = tenant.settings?.whatsappSettings as any;
  if (!settings?.enabled) return;

  if (status === AppointmentStatus.CONFIRMED && !settings?.appointmentConfirmationEnabled) return;
  if (status === AppointmentStatus.CANCELLED && !settings?.cancellationMessagesEnabled) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { customer: true, service: true, staff: true },
  });

  if (!appointment || !appointment.customer.mobile || appointment.customer.whatsappOptOut) {
    return;
  }

  const messageType =
    status === AppointmentStatus.CONFIRMED
      ? WhatsAppMessageType.APPOINTMENT_CONFIRMATION
      : WhatsAppMessageType.APPOINTMENT_CANCELLED;

  const customTemplate = await prisma.messageTemplate.findFirst({
    where: { tenantId, type: messageType, isActive: true },
  });

  const templateContent = customTemplate?.content || DEFAULT_TEMPLATES[messageType];

  const content = compileTemplate(templateContent, {
    customer_name: appointment.customer.name,
    business_name: tenant.name,
    appointment_date: format(appointment.appointmentDate, "yyyy-MM-dd"),
    appointment_time: format(appointment.startTime, "HH:mm"),
    service_name: appointment.service.name,
    staff_name: appointment.staff.name,
    business_phone: tenant.phone || "",
  });

  const idempotencyKey = `${tenantId}_${appointmentId}_${status}`;

  const existingJob = await prisma.messageJob.findUnique({
    where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
  });

  if (existingJob) return;

  await prisma.messageJob.create({
    data: {
      tenantId,
      type: messageType,
      recipient: appointment.customer.mobile,
      payload: {
        customerId: appointment.customer.id,
        appointmentId: appointment.id,
        content,
      },
      scheduledAt: new Date(),
      idempotencyKey,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      action: `${messageType}_QUEUED`,
      entityType: "Appointment",
      entityId: appointment.id,
      description: `Queued ${messageType} for appointment ${appointment.id}`,
    },
  });
}
