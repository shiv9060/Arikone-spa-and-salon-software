import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';

export async function getCustomers(
  tenantId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'ALL' | 'ACTIVE' | 'ARCHIVED';
    sort?: 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';
  } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const status = options.status || 'ACTIVE';
  const sort = options.sort || 'NEWEST';
  const search = options.search?.trim();

  const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { tenantId };

  if (status === 'ACTIVE') where.isActive = true;
  if (status === 'ARCHIVED') where.isActive = false;

  if (search) {
    // If it looks like an invoice search, we could do relation filtering, 
    // but the requirement says "invoice-number search depends on Invoice module.
    // If relations are available: implement safely."
    // Let's implement it.
    if (search.toLowerCase().startsWith('inv-') || search.length > 5) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          invoices: {
            some: {
              invoiceNumber: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    } else {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
  }

  let orderBy: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { createdAt: 'desc' };
  if (sort === 'OLDEST') orderBy = { createdAt: 'asc' };
  if (sort === 'NAME_ASC') orderBy = { name: 'asc' };
  if (sort === 'NAME_DESC') orderBy = { name: 'desc' };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { appointments: true, invoices: true }
        }
      }
    }),
    prisma.customer.count({ where })
  ]);

  return {
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getCustomerById(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      appointments: {
        orderBy: { appointmentDate: 'desc' },
        take: 5,
        include: { service: true }
      },
      invoices: {
        orderBy: { issuedAt: 'desc' },
        take: 5
      }
    }
  });

  if (!customer || customer.tenantId !== tenantId) {
    return null;
  }

  return customer;
}

export async function createCustomer(
  tenantId: string,
  userId: string,
  data: {
    name: string;
    mobile: string;
    email?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    address?: string | null;
    notes?: string | null;
    whatsappOptOut?: boolean;
  }
) {
  const existing = await prisma.customer.findFirst({
    where: { tenantId, mobile: data.mobile }
  });

  if (existing) {
    throw new Error('A customer with this mobile number already exists.');
  }

  const customer = await prisma.customer.create({
    data: {
      ...data,
      tenantId,
      isActive: true
    }
  });

  await logAudit(tenantId, userId, 'CUSTOMER_CREATED', 'Customer', customer.id, `Customer ${customer.name} was created.`);

  return customer;
}

export async function updateCustomer(
  tenantId: string,
  userId: string,
  customerId: string,
  data: {
    name?: string;
    mobile?: string;
    email?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    address?: string | null;
    notes?: string | null;
    whatsappOptOut?: boolean;
  }
) {
  const existing = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error('Customer not found.');
  }

  if (data.mobile && data.mobile !== existing.mobile) {
    const mobileExists = await prisma.customer.findFirst({
      where: { tenantId, mobile: data.mobile, id: { not: customerId } }
    });
    if (mobileExists) {
      throw new Error('A customer with this mobile number already exists.');
    }
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data
  });

  await logAudit(tenantId, userId, 'CUSTOMER_UPDATED', 'Customer', customerId, `Customer ${updated.name} was updated.`);

  return updated;
}

export async function archiveCustomer(tenantId: string, userId: string, customerId: string) {
  const existing = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error('Customer not found.');
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false }
  });

  await logAudit(tenantId, userId, 'CUSTOMER_ARCHIVED', 'Customer', customerId, `Customer ${updated.name} was archived.`);

  return updated;
}

export async function restoreCustomer(tenantId: string, userId: string, customerId: string) {
  const existing = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!existing || existing.tenantId !== tenantId) {
    throw new Error('Customer not found.');
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: true }
  });

  await logAudit(tenantId, userId, 'CUSTOMER_RESTORED', 'Customer', customerId, `Customer ${updated.name} was restored.`);

  return updated;
}

export async function getCustomerStats(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      appointments: {
        where: { status: 'COMPLETED' },
        orderBy: { appointmentDate: 'desc' },
        include: { service: true }
      },
      invoices: {
        where: { paymentStatus: { in: ['PAID', 'PARTIAL'] } }
      }
    }
  });

  if (!customer || customer.tenantId !== tenantId) {
    throw new Error('Customer not found.');
  }

  const totalVisits = customer.appointments.length;
  const totalSpending = customer.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const lastVisit = customer.appointments.length > 0 ? customer.appointments[0].appointmentDate : null;

  // Calculate favorite service
  let favouriteService = null;
  if (customer.appointments.length > 0) {
    const serviceCounts = customer.appointments.reduce((acc, appt) => {
      acc[appt.service.name] = (acc[appt.service.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    favouriteService = Object.keys(serviceCounts).sort((a, b) => serviceCounts[b] - serviceCounts[a])[0];
  }

  // Get upcoming appointment
  const upcomingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId,
      customerId,
      appointmentDate: { gte: new Date() },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] }
    },
    orderBy: { appointmentDate: 'asc' },
    include: { service: true }
  });

  return {
    totalVisits,
    totalSpending,
    lastVisit,
    favouriteService,
    upcomingAppointment
  };
}
