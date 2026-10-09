import 'server-only';
import prisma from '@/lib/db/prisma';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export async function getCustomerReport(tenantId: string, range: DateRange, page: number = 1, limit: number = 10) {
  const whereCreated = { tenantId, createdAt: { gte: range.startDate, lte: range.endDate } };
  const whereActive = { tenantId, isActive: true };
  const whereArchived = { tenantId, isActive: false };

  const [newCustomers, activeCustomers, archivedCustomers] = await Promise.all([
    prisma.customer.count({ where: whereCreated }),
    prisma.customer.count({ where: whereActive }),
    prisma.customer.count({ where: whereArchived }),
  ]);

  // For the table, we'll get a paginated list of customers and compute some stats
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { appointments: true }
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 1,
          select: { appointmentDate: true }
        },
        invoices: {
          where: { paymentStatus: { in: ['PAID', 'PARTIAL'] } },
          select: { total: true }
        }
      }
    }),
    prisma.customer.count({ where: { tenantId } })
  ]);

  const customerData = customers.map(c => {
    const totalVisits = c._count.appointments;
    const totalSpending = c.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const lastVisit = c.appointments[0]?.appointmentDate || null;
    return {
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      joinedDate: c.createdAt,
      totalVisits,
      totalSpending,
      lastVisit,
      status: c.isActive ? 'Active' : 'Archived'
    };
  });

  return {
    metrics: { newCustomers, activeCustomers, archivedCustomers },
    table: {
      data: customerData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  };
}

export async function getAppointmentReport(tenantId: string, range: DateRange) {
  const where = { tenantId, appointmentDate: { gte: range.startDate, lte: range.endDate } };
  
  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      status: true,
      appointmentDate: true
    }
  });

  const total = appointments.length;
  const metrics = {
    total,
    confirmed: 0,
    arrived: 0,
    serviceStarted: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    completionRate: 0
  };

  const trend: Record<string, number> = {};

  appointments.forEach(app => {
    const status = app.status;
    if (status === 'CONFIRMED') metrics.confirmed++;
    if (status === 'ARRIVED') metrics.arrived++;
    if (status === 'SERVICE_STARTED') metrics.serviceStarted++;
    if (status === 'COMPLETED') metrics.completed++;
    if (status === 'CANCELLED') metrics.cancelled++;
    if (status === 'NO_SHOW') metrics.noShow++;
    
    // For trend, aggregate by day
    const dateStr = app.appointmentDate.toISOString().split('T')[0];
    trend[dateStr] = (trend[dateStr] || 0) + 1;
  });

  const eligibleForCompletion = total - metrics.cancelled - metrics.noShow;
  if (eligibleForCompletion > 0) {
    metrics.completionRate = (metrics.completed / eligibleForCompletion) * 100;
  }

  return { metrics, trend };
}

export async function getBillingReport(tenantId: string, range: DateRange) {
  const where = { tenantId, issuedAt: { gte: range.startDate, lte: range.endDate } };
  
  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      status: true,
      subtotal: true,
      discount: true,
      tax: true,
      total: true,
      payments: {
        select: { amount: true }
      }
    }
  });

  const metrics = {
    created: invoices.length,
    finalized: 0,
    cancelled: 0,
    grossBilling: 0,
    discounts: 0,
    tax: 0,
    netBilling: 0,
    amountPaid: 0,
    outstanding: 0
  };

  invoices.forEach(inv => {
    if (inv.status === 'FINALIZED') {
      metrics.finalized++;
      metrics.grossBilling += Number(inv.subtotal);
      metrics.discounts += Number(inv.discount);
      metrics.tax += Number(inv.tax);
      metrics.netBilling += Number(inv.total);
      
      const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      metrics.amountPaid += paid;
      metrics.outstanding += (Number(inv.total) - paid);
    } else if (inv.status === 'CANCELLED') {
      metrics.cancelled++;
    }
  });

  return metrics;
}

export async function getRevenueReport(tenantId: string, range: DateRange) {
  const payments = await prisma.payment.findMany({
    where: { tenantId, paidAt: { gte: range.startDate, lte: range.endDate } },
    select: { amount: true, paidAt: true, paymentMode: true }
  });

  let totalCollected = 0;
  const trend: Record<string, number> = {};
  
  payments.forEach(p => {
    const amt = Number(p.amount);
    totalCollected += amt;
    const dateStr = p.paidAt.toISOString().split('T')[0];
    trend[dateStr] = (trend[dateStr] || 0) + amt;
  });

  // Calculate outstanding across all time, or maybe just for invoices created in this period?
  // The prompt says: "Revenue: Revenue must be based on the established payment/reporting definition. Payment Collection. Outstanding."
  // Usually outstanding is total outstanding for all time.
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { tenantId, paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
    select: { total: true, payments: { select: { amount: true } } }
  });
  
  let totalOutstanding = 0;
  outstandingInvoices.forEach(inv => {
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    totalOutstanding += (Number(inv.total) - paid);
  });

  return {
    metrics: { revenue: totalCollected, outstanding: totalOutstanding },
    trend,
    payments
  };
}

export async function getPaymentModeReport(tenantId: string, range: DateRange) {
  const payments = await prisma.payment.findMany({
    where: { tenantId, paidAt: { gte: range.startDate, lte: range.endDate } },
    select: { amount: true, paymentMode: true }
  });

  const breakdown = {
    CASH: { count: 0, amount: 0 },
    UPI: { count: 0, amount: 0 },
    CARD: { count: 0, amount: 0 },
    BANK_TRANSFER: { count: 0, amount: 0 },
    OTHER: { count: 0, amount: 0 }
  };

  payments.forEach(p => {
    const mode = p.paymentMode as keyof typeof breakdown;
    if (breakdown[mode]) {
      breakdown[mode].count++;
      breakdown[mode].amount += Number(p.amount);
    }
  });

  return breakdown;
}

export async function getServiceReport(tenantId: string, range: DateRange) {
  const services = await prisma.service.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      invoiceItems: {
        where: { createdAt: { gte: range.startDate, lte: range.endDate } },
        select: {
          quantity: true,
          total: true,
          invoice: { select: { status: true } }
        }
      }
    }
  });

  return services.map(s => {
    let bookings = 0;
    let completed = 0;
    let revenue = 0;

    s.invoiceItems.forEach(item => {
      bookings += item.quantity;
      if (item.invoice?.status === 'FINALIZED') {
        completed += item.quantity;
        revenue += Number(item.total);
      }
    });

    return {
      id: s.id,
      name: s.name,
      category: s.category?.name || 'Uncategorized',
      bookings,
      completed,
      revenue,
      averageRevenue: completed > 0 ? revenue / completed : 0
    };
  }).filter(s => s.bookings > 0);
}

export async function getStaffReport(tenantId: string, range: DateRange) {
  const staff = await prisma.staff.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      appointments: {
        where: { appointmentDate: { gte: range.startDate, lte: range.endDate } },
        select: {
          status: true,
          invoice: { select: { total: true } }
        }
      }
    }
  });

  return staff.map(s => {
    let appointments = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    let revenue = 0;

    s.appointments.forEach(app => {
      appointments++;
      if (app.status === 'COMPLETED') {
        completed++;
        revenue += Number(app.invoice?.total || 0);
      }
      if (app.status === 'CANCELLED') cancelled++;
      if (app.status === 'NO_SHOW') noShow++;
    });

    return {
      id: s.id,
      name: s.name,
      appointments,
      completed,
      cancelled,
      noShow,
      revenue
    };
  }).filter(s => s.appointments > 0);
}
