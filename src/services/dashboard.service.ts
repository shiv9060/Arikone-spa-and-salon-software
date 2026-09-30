import 'server-only';
import prisma from '@/lib/db/prisma';
import { startOfDay, endOfDay, format } from 'date-fns';

export async function getDashboardStats(tenantId: string, targetDate: Date) {
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  // Today's Appointments
  const todayAppointments = await prisma.appointment.count({
    where: {
      tenantId,
      appointmentDate: {
        gte: start,
        lte: end,
      },
    },
  });

  // Today's Revenue (Payments received today)
  const todayPayments = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      tenantId,
      paidAt: {
        gte: start,
        lte: end,
      },
    },
  });
  const todayRevenue = Number(todayPayments._sum.amount || 0);

  // Total Bills (Invoices generated today)
  const totalBills = await prisma.invoice.count({
    where: {
      tenantId,
      issuedAt: {
        gte: start,
        lte: end,
      },
    },
  });

  // New Customers (Created today)
  const newCustomers = await prisma.customer.count({
    where: {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  // Pending Payments (All time, outstanding)
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      paymentStatus: {
        in: ['PENDING', 'PARTIAL'],
      },
    },
    select: {
      total: true,
      payments: {
        select: {
          amount: true,
        },
      },
    },
  });

  let pendingAmount = 0;
  for (const inv of pendingInvoices) {
    const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    pendingAmount += (Number(inv.total) - paid);
  }

  // Today's Customers (Unique customers with appointments today)
  const todayCustomerIds = await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: {
        gte: start,
        lte: end,
      },
    },
    select: { customerId: true },
    distinct: ['customerId'],
  });

  return {
    todayAppointments,
    todayRevenue,
    totalBills,
    newCustomers,
    pendingPayments: pendingAmount,
    todayCustomers: todayCustomerIds.length,
  };
}

export async function getUpcomingAppointments(tenantId: string, targetDate: Date) {
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: {
        gte: start,
        lte: end,
      },
      status: {
        notIn: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      },
    },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } },
      staff: { select: { name: true } },
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 10,
  });

  return appointments.map(app => ({
    id: app.id,
    time: format(app.startTime, 'hh:mm a'),
    customerName: app.customer.name,
    serviceName: app.service.name,
    staffName: app.staff.name,
    status: app.status,
  }));
}

export async function getTopServices(tenantId: string, targetDate: Date) {
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  const services = await prisma.service.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      appointments: {
        where: {
          appointmentDate: {
            gte: start,
            lte: end,
          },
          status: 'COMPLETED'
        },
        select: {
          id: true,
          invoice: {
            select: { total: true }
          }
        }
      }
    }
  });

  const formatted = services.map(s => {
    const revenue = s.appointments.reduce((sum, app) => sum + Number(app.invoice?.total || 0), 0);
    return {
      id: s.id,
      name: s.name,
      bookings: s.appointments.length,
      revenue
    };
  }).filter(s => s.bookings > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return formatted;
}

export async function getStaffPerformance(tenantId: string, targetDate: Date) {
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  const staff = await prisma.staff.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      appointments: {
        where: {
          appointmentDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          status: true,
          invoice: {
            select: { total: true }
          }
        }
      }
    }
  });

  const formatted = staff.map(s => {
    const completed = s.appointments.filter(a => a.status === 'COMPLETED');
    const revenue = completed.reduce((sum, app) => sum + Number(app.invoice?.total || 0), 0);
    return {
      id: s.id,
      name: s.name,
      totalAppointments: s.appointments.length,
      completedAppointments: completed.length,
      revenue
    };
  }).filter(s => s.totalAppointments > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return formatted;
}

export async function getRecentActivity(tenantId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      entityType: true,
      createdAt: true,
      description: true,
    }
  });
  return logs;
}
