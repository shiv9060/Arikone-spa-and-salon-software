import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createAppointment, 
  updateAppointment, 
  updateAppointmentStatus, 
  checkAppointmentConflict,
  getAppointments 
} from '@/services/appointment.service';
import prisma from '@/lib/db/prisma';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      appointment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
      },
      customer: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      service: {
        findUnique: vi.fn(),
      },
      staff: {
        findUnique: vi.fn(),
      }
    }
  };
});

vi.mock('@/services/audit.service', () => ({
  logAudit: vi.fn(),
}));

describe('Appointment Management', () => {
  const tenantA = 'tenant-A';
  const tenantB = 'tenant-B';
  const userA = 'user-A';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Authorized user can create appointment', async () => {
    (prisma.customer.findUnique as any).mockResolvedValue({ id: 'c1', tenantId: tenantA, isActive: true });
    (prisma.service.findUnique as any).mockResolvedValue({ id: 's1', tenantId: tenantA, isActive: true });
    (prisma.staff.findUnique as any).mockResolvedValue({ id: 'st1', tenantId: tenantA, status: 'ACTIVE' });
    (prisma.appointment.findFirst as any).mockResolvedValue(null); // No conflict
    (prisma.appointment.create as any).mockResolvedValue({ id: 'a1', customer: { name: 'Test' } });

    const result = await createAppointment(tenantA, userA, {
      customerId: 'c1',
      serviceId: 's1',
      staffId: 'st1',
      appointmentDate: new Date('2023-10-15T00:00:00'),
      startTime: new Date('2023-10-15T10:00:00'),
      endTime: new Date('2023-10-15T11:00:00')
    });

    expect(result.id).toBe('a1');
  });

  it('2. Service must belong to tenant', async () => {
    (prisma.customer.findUnique as any).mockResolvedValue({ id: 'c1', tenantId: tenantA, isActive: true });
    (prisma.service.findUnique as any).mockResolvedValue({ id: 's1', tenantId: tenantB, isActive: true });

    await expect(createAppointment(tenantA, userA, {
      customerId: 'c1',
      serviceId: 's1',
      staffId: 'st1',
      appointmentDate: new Date('2023-10-15T00:00:00'),
      startTime: new Date('2023-10-15T10:00:00'),
      endTime: new Date('2023-10-15T11:00:00')
    })).rejects.toThrow('Invalid service');
  });

  it('3. Conflict Detection: Overlapping appointment rejected', async () => {
    (prisma.customer.findUnique as any).mockResolvedValue({ id: 'c1', tenantId: tenantA, isActive: true });
    (prisma.service.findUnique as any).mockResolvedValue({ id: 's1', tenantId: tenantA, isActive: true });
    (prisma.staff.findUnique as any).mockResolvedValue({ id: 'st1', tenantId: tenantA, status: 'ACTIVE' });
    
    // Simulate conflict exists
    (prisma.appointment.findFirst as any).mockResolvedValue({ id: 'existing' });

    await expect(createAppointment(tenantA, userA, {
      customerId: 'c1',
      serviceId: 's1',
      staffId: 'st1',
      appointmentDate: new Date('2023-10-15T00:00:00'),
      startTime: new Date('2023-10-15T10:00:00'),
      endTime: new Date('2023-10-15T11:00:00')
    })).rejects.toThrow('already booked during this time');
  });

  it('4. Tenant A cannot update Tenant B appointment', async () => {
    (prisma.appointment.findUnique as any).mockResolvedValue({
      id: 'a1',
      tenantId: tenantB
    });

    await expect(updateAppointment(tenantA, userA, 'a1', {
      customerId: 'c1',
      serviceId: 's1',
      staffId: 'st1',
      appointmentDate: new Date(),
      startTime: new Date(),
      endTime: new Date()
    })).rejects.toThrow('Appointment not found');
  });
});
