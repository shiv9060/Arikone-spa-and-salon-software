import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsService from '@/services/settings.service';
import prisma from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => {
  return {
    default: {
      tenant: {
        update: vi.fn(),
      },
      tenantSettings: {
        upsert: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      }
    }
  };
});

describe('Settings Management', () => {
  const tenantA = 'tenant-a';
  const ownerA = 'owner-a';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Owner can update business settings', async () => {
    vi.mocked(prisma.tenant.update).mockResolvedValue({ id: tenantA, name: 'Updated Name', businessType: 'SPA' } as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);
    
    const updated = await settingsService.updateBusinessProfile(tenantA, ownerA, {
      name: 'Updated Name', businessType: 'SPA'
    });
    
    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: tenantA } })
    );
    expect(updated.name).toBe('Updated Name');
  });
});
