import prisma from "@/lib/db/prisma";
import { AppointmentStatus, WhatsAppMessageType } from "@prisma/client";
import { DEFAULT_TEMPLATES, compileTemplate } from "./templates";
import { format } from "date-fns";

export async function processAppointmentReminders() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    include: { settings: true },
  });

  for (const tenant of tenants) {
    const settings = tenant.settings?.whatsappSettings as any;
    if (!settings?.enabled || !settings?.appointmentRemindersEnabled) {
      continue;
    }

    // Default reminder is 24 hours before
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in24HoursAnd1Hour = new Date(in24Hours.getTime() + 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        status: AppointmentStatus.CONFIRMED,
        appointmentDate: {
          gte: in24Hours,
          lt: in24HoursAnd1Hour,
        },
        customer: {
          whatsappOptOut: false,
          mobile: { not: "" },
        },
      },
      include: {
        customer: true,
        service: true,
      },
    });

    const customTemplate = await prisma.messageTemplate.findFirst({
      where: { tenantId: tenant.id, type: WhatsAppMessageType.APPOINTMENT_REMINDER, isActive: true },
    });
    
    const templateContent = customTemplate?.content || DEFAULT_TEMPLATES.APPOINTMENT_REMINDER;

    for (const appt of appointments) {
      const idempotencyKey = `${tenant.id}_${appt.id}_REMINDER_24H`;
      
      const existingJob = await prisma.messageJob.findUnique({
        where: { tenantId_idempotencyKey: { tenantId: tenant.id, idempotencyKey } },
      });

      if (existingJob) continue;

      const content = compileTemplate(templateContent, {
        customer_name: appt.customer.name,
        business_name: tenant.name,
        appointment_date: format(appt.appointmentDate, "yyyy-MM-dd"),
        appointment_time: format(appt.startTime, "HH:mm"),
        service_name: appt.service.name,
        business_phone: tenant.phone || "",
      });

      await prisma.messageJob.create({
        data: {
          tenantId: tenant.id,
          type: WhatsAppMessageType.APPOINTMENT_REMINDER,
          recipient: appt.customer.mobile,
          payload: {
            customerId: appt.customer.id,
            appointmentId: appt.id,
            content,
          },
          scheduledAt: new Date(),
          idempotencyKey,
        },
      });
      
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "APPOINTMENT_REMINDER_QUEUED",
          entityType: "Appointment",
          entityId: appt.id,
          description: `Queued reminder for appointment ${appt.id}`,
        }
      });
    }
  }
}
