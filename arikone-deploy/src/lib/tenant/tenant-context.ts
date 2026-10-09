import { getCurrentUser } from '../auth/auth-utils';

/**
 * Interface representing the current authenticated tenant context.
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

/**
 * Fetches the current tenant context based on the authenticated user.
 */
export async function getCurrentTenant(): Promise<TenantContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { 
    tenantId: user.tenantId, 
    userId: user.userId, 
    role: user.role 
  };
}

/**
 * Enforces that a tenant context exists, throwing an error if not.
 * Use this in server actions and API routes where tenant context is mandatory.
 */
export async function requireTenant(): Promise<TenantContext> {
  const context = await getCurrentTenant();
  if (!context) {
    throw new Error('UNAUTHORIZED: No active tenant context found.');
  }
  return context;
}
