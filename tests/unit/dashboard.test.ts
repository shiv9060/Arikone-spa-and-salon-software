import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dashboardService from '../../src/services/dashboard.service';
import prisma from '../../src/lib/db/prisma';

// Mocks
vi.mock('../../src/lib/db/prisma', () => {
  return {
    default: {
      appointment: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      payment: {
        aggregate: vi.fn(),
      },
      invoice: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      customer: {
        count: vi.fn(),
      },
      service: {
        findMany: vi.fn(),
      },
      staff: {
        findMany: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
      }
    }
  };
});

describe('Dashboard Service & Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantA = 'tenant-A';
  const tenantB = 'tenant-B';
  const targetDate = new Date();

  it('TEST 3: Dashboard data is tenant scoped', async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(10);
    // @ts-expect-error - mocked db
    vi.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: 500 } });
    vi.mocked(prisma.invoice.count).mockResolvedValue(5);
    vi.mocked(prisma.customer.count).mockResolvedValue(2);
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

    await dashboardService.getDashboardStats(tenantA, targetDate);

    // Verify Prisma was called with tenantA
    expect(prisma.appointment.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: tenantA })
      })
    );
    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: tenantA })
      })
    );
  });

  it('TEST 4: Tenant A dashboard cannot contain Tenant B data', async () => {
    // This is intrinsically protected by the Prisma queries injecting `where: { tenantId }` in the service.
    // If a request for Tenant A comes, the query enforces Tenant A.
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    
    await dashboardService.getUpcomingAppointments(tenantA, targetDate);
    
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: tenantA })
      })
    );
    // Ensure it NEVER called for tenantB
    expect(prisma.appointment.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: tenantB })
      })
    );
  });

  it('TEST 10: Dashboard handles empty database', async () => {
    // Mock all to return 0 or empty
    vi.mocked(prisma.appointment.count).mockResolvedValue(0);
    // @ts-expect-error - mocked db
    vi.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: null } });
    vi.mocked(prisma.invoice.count).mockResolvedValue(0);
    vi.mocked(prisma.customer.count).mockResolvedValue(0);
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);

    const stats = await dashboardService.getDashboardStats(tenantA, targetDate);

    expect(stats.todayAppointments).toBe(0);
    expect(stats.todayRevenue).toBe(0);
    expect(stats.totalBills).toBe(0);
    expect(stats.newCustomers).toBe(0);
    expect(stats.pendingPayments).toBe(0);
    expect(stats.todayCustomers).toBe(0);
  });

  it('TEST 11: Dashboard handles database/service error gracefully if caught', async () => {
    // We expect the higher-level error.tsx to catch this, so the service SHOULD throw
    vi.mocked(prisma.appointment.count).mockRejectedValue(new Error('Database disconnected'));
    
    await expect(dashboardService.getDashboardStats(tenantA, targetDate)).rejects.toThrow('Database disconnected');
  });
});
