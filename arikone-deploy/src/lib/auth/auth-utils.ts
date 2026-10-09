import 'server-only';
import { getSession } from './session';
import prisma from '../db/prisma';
import { Permission, hasPermission, RoleType } from './permissions';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const payload = await getSession();
  if (!payload) return null;

  // Verify the user still exists and is active in the database
  // This ensures deleted or deactivated users lose access immediately
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true, tenantId: true }
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  // Safety check to ensure tenant matches
  if (dbUser.tenantId !== payload.tenantId) {
    return null;
  }

  return { ...payload, role: dbUser.role };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  
  if (!hasPermission(user.role as RoleType, permission)) {
    throw new Error('FORBIDDEN: You do not have permission to perform this action.');
  }

  return user;
}

/**
 * Validates a user without redirecting, useful for APIs that return 401/403 instead of 302
 */
export async function requireAuthApi() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requirePermissionApi(permission: Permission) {
  const user = await requireAuthApi();
  
  if (!hasPermission(user.role as RoleType, permission)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}
