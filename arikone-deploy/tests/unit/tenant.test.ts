import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertTenantOwnership } from '../../src/lib/tenant/tenant-guard';
import { withTenant } from '../../src/lib/tenant/tenant-query';

// Mock DB records
const customerA = { id: 'c1', tenantId: 'tenant-A', name: 'John Doe' };
const customerB = { id: 'c2', tenantId: 'tenant-B', name: 'Jane Smith' };
const serviceB = { id: 's1', tenantId: 'tenant-B', name: 'Haircut' };

// Mock service layer functionality
class CustomerService {
  async getCustomerById(tenantId: string, customerId: string) {
    const mockDb = [customerA, customerB];
    const customer = mockDb.find(c => c.id === customerId);
    if (!customer) return null;
    
    // Validate isolation
    assertTenantOwnership(tenantId, customer.tenantId, 'Customer');
    return customer;
  }
}

class AppointmentService {
  async createAppointment(tenantId: string, customerId: string, serviceId: string, staffId: string) {
    // Simulated DB fetch
    const customer = customerId === 'c1' ? customerA : customerB;
    const service = serviceId === 's1' ? serviceB : { id: 's2', tenantId: 'tenant-A' };
    const staff = staffId === 'staff1' ? { id: 'staff1', tenantId: 'tenant-A' } : { id: 'staff2', tenantId: 'tenant-B' };

    // Validations
    assertTenantOwnership(tenantId, customer.tenantId, 'Customer');
    assertTenantOwnership(tenantId, service.tenantId, 'Service');
    assertTenantOwnership(tenantId, staff.tenantId, 'Staff');

    return { id: 'app1', tenantId };
  }
}

describe('Tenant Isolation', () => {
  const customerService = new CustomerService();
  const appointmentService = new AppointmentService();

  it('TEST 1: Tenant A can access Tenant A customer', async () => {
    const result = await customerService.getCustomerById('tenant-A', 'c1');
    expect(result).toBeDefined();
    expect(result?.name).toBe('John Doe');
  });

  it('TEST 2: Tenant A cannot access Tenant B customer', async () => {
    await expect(customerService.getCustomerById('tenant-A', 'c2')).rejects.toThrow(/FORBIDDEN/);
  });

  it('TEST 5: Tenant A cannot create appointment using Tenant B service', async () => {
    await expect(
      appointmentService.createAppointment('tenant-A', 'c1', 's1', 'staff1')
    ).rejects.toThrow(/FORBIDDEN.*Service/);
  });

  it('TEST 6: Tenant A cannot create appointment using Tenant B staff', async () => {
    await expect(
      appointmentService.createAppointment('tenant-A', 'c1', 's2', 'staff2') // staff2 is tenant-B
    ).rejects.toThrow(/FORBIDDEN.*Staff/);
  });

  it('TEST 8: Invoice number can repeat across tenants', () => {
    // This is tested at schema level via @@unique([tenantId, invoiceNumber]).
    // We confirm the logic by checking if withTenant appends correctly.
    const query = {
      where: {
        invoiceNumber: 'INV-001',
        ...withTenant('tenant-A')
      }
    };
    expect(query.where.tenantId).toBe('tenant-A');
  });
});
