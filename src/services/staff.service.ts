import 'server-only';
import prisma from '@/lib/db/prisma';
import { logAudit } from './audit.service';
import { StaffStatus } from '@prisma/client';

export async function getStaffList(tenantId: string, search?: string, status?: StaffStatus) {
  const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { tenantId };
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { designation: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.staff.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStaffMember(tenantId: string, staffId: string) {
  return prisma.staff.findUnique({
    where: { id: staffId, tenantId },
  });
}

export type CreateStaffInput = {
  name: string;
  mobile?: string | null;
  email?: string | null;
  designation?: string | null;
  joiningDate?: Date | null;
  status: StaffStatus;
  commissionType?: string | null;
  commissionValue?: number | null;
  notes?: string | null;
};

export async function createStaff(tenantId: string, userId: string, data: CreateStaffInput) {
  const staff = await prisma.staff.create({
    data: {
      ...data,
      tenantId,
    },
  });

  await logAudit(tenantId, userId, 'STAFF_CREATED', 'Staff', staff.id, `Staff created: ${staff.name}`);
  return staff;
}

export type UpdateStaffInput = Partial<CreateStaffInput>;

export async function updateStaff(tenantId: string, userId: string, staffId: string, data: UpdateStaffInput) {
  const existing = await prisma.staff.findUnique({
    where: { id: staffId, tenantId },
  });

  if (!existing) throw new Error('Staff not found');

  const staff = await prisma.staff.update({
    where: { id: staffId, tenantId },
    data,
  });

  await logAudit(tenantId, userId, 'STAFF_UPDATED', 'Staff', staff.id, `Staff updated: ${staff.name}`);
  return staff;
}

export async function deactivateStaff(tenantId: string, userId: string, staffId: string) {
  const existing = await prisma.staff.findUnique({
    where: { id: staffId, tenantId },
  });

  if (!existing) throw new Error('Staff not found');

  const staff = await prisma.staff.update({
    where: { id: staffId, tenantId },
    data: { status: 'INACTIVE' },
  });

  await logAudit(tenantId, userId, 'STAFF_DEACTIVATED', 'Staff', staff.id, `Staff deactivated: ${staff.name}`);
  return staff;
}
