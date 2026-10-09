import 'server-only';
import prisma from '@/lib/db/prisma';

export async function logAudit(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  description?: string | null,
  metadata?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        description,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log', error);
  }
}
