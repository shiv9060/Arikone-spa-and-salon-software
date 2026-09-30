import { TenantContext } from './tenant-context';

/**
 * Asserts that the entity belongs to the current tenant.
 * Use this to validate cross-tenant data leaks before creating relationships.
 * 
 * @param tenantId The current tenant context ID
 * @param entityTenantId The tenant ID of the entity being accessed
 * @param entityName For logging purposes
 */
export function assertTenantOwnership(
  tenantId: string, 
  entityTenantId: string, 
  entityName: string = 'Entity'
): void {
  if (tenantId !== entityTenantId) {
    console.error(`SECURITY ALERT: Cross-tenant access attempted on ${entityName}.`);
    throw new Error(`FORBIDDEN: You do not have permission to access this ${entityName}.`);
  }
}
