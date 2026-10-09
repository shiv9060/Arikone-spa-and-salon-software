import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serviceService from '@/services/service.service';
import * as categoryService from '@/services/service-category.service';
import prisma from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      service: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      serviceCategory: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      }
    }
  };
});

describe('Service Management', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const ownerA = 'owner-a';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Owner can create service', async () => {
    vi.mocked(prisma.service.create).mockResolvedValue({ id: 's1', name: 'Haircut', tenantId: tenantA } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const s = await serviceService.createService(tenantA, ownerA, {
      name: 'Haircut', price: 500, durationMinutes: 30, taxPercent: 0, isActive: true
    });
    
    expect(prisma.service.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: tenantA }) })
    );
    expect(s.id).toBeDefined();
  });

  it('Tenant A cannot update Tenant B service', async () => {
    vi.mocked(prisma.service.findUnique).mockResolvedValue(null);
    
    await expect(
      serviceService.updateService(tenantA, ownerA, 's-b', { name: 'Hacked' })
    ).rejects.toThrow('Service not found');
  });

  it('Category names cannot duplicate within same tenant', async () => {
    vi.mocked(prisma.serviceCategory.findUnique).mockResolvedValue({ id: 'c1' } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    await expect(
      categoryService.createCategory(tenantA, ownerA, { name: 'Hair', isActive: true, sortOrder: 0 })
    ).rejects.toThrow('Category name already exists in your business');
  });
});
