import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as staffService from '@/services/staff.service';
import prisma from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      staff: {
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

describe('Staff Management', () => {
  const tenantA = 'tenant-a';
  const ownerA = 'owner-a';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Owner can create staff', async () => {
    vi.mocked(prisma.staff.create).mockResolvedValue({ id: 'staff1', name: 'John Doe', tenantId: tenantA } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const staff = await staffService.createStaff(tenantA, ownerA, {
      name: 'John Doe', status: 'ACTIVE'
    });
    
    expect(prisma.staff.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: tenantA }) })
    );
    expect(staff.id).toBeDefined();
  });

  it('Tenant A cannot update Tenant B staff', async () => {
    vi.mocked(prisma.staff.findUnique).mockResolvedValue(null);
    
    await expect(
      staffService.updateStaff(tenantA, ownerA, 'staff-b', { name: 'Hacked' })
    ).rejects.toThrow('Staff not found');
  });
});
