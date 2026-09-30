/**
 * Base tenant query that must be mixed into every Prisma database query
 * to enforce tenant isolation at the database layer.
 * 
 * @param tenantId The current tenant context ID
 */
export function withTenant(tenantId: string) {
  if (!tenantId) {
    throw new Error('Tenant ID is strictly required for database queries.');
  }
  return { tenantId };
}
