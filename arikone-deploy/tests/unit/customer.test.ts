import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as customerService from '@/services/customer.service';
import prisma from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      customer: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      appointment: {
        findFirst: vi.fn(),
      }
    }
  };
});

vi.mock('@/services/audit.service', () => ({
  logAudit: vi.fn(),
}));

describe('Customer Management', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const ownerA = 'owner-a';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Authorized user can create customer', async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.customer.create).mockResolvedValue({ id: 'c1', name: 'John', mobile: '9999999999', tenantId: tenantA } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const customer = await customerService.createCustomer(tenantA, ownerA, {
      name: 'John', mobile: '9999999999'
    });
    
    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: tenantA, mobile: '9999999999' }) })
    );
    expect(customer.id).toBeDefined();
  });

  it('2. Tenant A can access Tenant A customer', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: 'c1', name: 'John', tenantId: tenantA } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const customer = await customerService.getCustomerById(tenantA, 'c1');
    expect(customer?.name).toBe('John');
  });

  it('3. Tenant A cannot access Tenant B customer', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: 'c2', name: 'Jane', tenantId: tenantB } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const customer = await customerService.getCustomerById(tenantA, 'c2');
    expect(customer).toBeNull();
  });

  it('4. Tenant A cannot modify Tenant B customer', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: 'c2', name: 'Jane', tenantId: tenantB } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    await expect(
      customerService.updateCustomer(tenantA, ownerA, 'c2', { name: 'Hacked' })
    ).rejects.toThrow('Customer not found.');
  });

  it('5. Tenant A cannot archive Tenant B customer', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({ id: 'c2', name: 'Jane', tenantId: tenantB } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    await expect(
      customerService.archiveCustomer(tenantA, ownerA, 'c2')
    ).rejects.toThrow('Customer not found.');
  });

  it('6. Name search is tenant scoped', async () => {
    vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
    vi.mocked(prisma.customer.count).mockResolvedValue(0);
    
    await customerService.getCustomers(tenantA, { search: 'John' });
    
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ 
        where: expect.objectContaining({ 
          tenantId: tenantA,
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: 'John', mode: 'insensitive' } })
          ])
        }) 
      })
    );
  });

  it('7. Invoice search is tenant scoped', async () => {
    vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
    vi.mocked(prisma.customer.count).mockResolvedValue(0);
    
    await customerService.getCustomers(tenantA, { search: 'INV-123' });
    
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ 
        where: expect.objectContaining({ 
          tenantId: tenantA,
          OR: expect.arrayContaining([
            expect.objectContaining({ invoices: { some: { invoiceNumber: { contains: 'INV-123', mode: 'insensitive' } } } })
          ])
        }) 
      })
    );
  });

  it('8. Customer statistics do not fabricate values', async () => {
    vi.mocked(prisma.customer.findUnique).mockResolvedValue({
      id: 'c1', tenantId: tenantA,
      appointments: [],
      invoices: []
    } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
    
    const stats = await customerService.getCustomerStats(tenantA, 'c1');
    expect(stats.totalVisits).toBe(0);
    expect(stats.totalSpending).toBe(0);
    expect(stats.lastVisit).toBeNull();
    expect(stats.favouriteService).toBeNull();
    expect(stats.upcomingAppointment).toBeNull();
  });
});
