'use server';

import { z } from 'zod';
import * as argon2 from 'argon2';
import prisma from '@/lib/db/prisma';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { RoleType } from '@/lib/auth/permissions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const parsed = loginSchema.safeParse({ email, password });
  
  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  try {
    const platformAdmin = await prisma.platformAdmin.findUnique({
      where: { email: parsed.data.email }
    });

    if (platformAdmin) {
      if (platformAdmin.status !== 'ACTIVE') {
        return { error: 'Admin account is disabled.' };
      }

      const isPasswordValid = await argon2.verify(platformAdmin.passwordHash, parsed.data.password);
      if (!isPasswordValid) {
        return { error: 'Invalid email or password.' };
      }

      await prisma.platformAdmin.update({
        where: { id: platformAdmin.id },
        data: { lastLoginAt: new Date() }
      });

      await createSession({
        userId: platformAdmin.id,
        tenantId: 'platform',
        role: 'SUPER_ADMIN',
        name: platformAdmin.name,
        email: platformAdmin.email,
        tenantName: 'Arikone Platform',
      });

      redirect('/admin/dashboard');
    }

    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email },
      include: {
        tenant: true
      }
    });

    if (!user || !user.isActive) {
      // Log generic failure
      if (user) {
        await logAuthEvent(user.tenantId, user.id, 'LOGIN_FAILED', 'User is inactive or credentials invalid');
      }
      return { error: 'Invalid email or password.' };
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, parsed.data.password);

    if (!isPasswordValid) {
      await logAuthEvent(user.tenantId, user.id, 'LOGIN_FAILED', 'Invalid password');
      return { error: 'Invalid email or password.' };
    }

    await createSession({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as RoleType,
      name: user.name,
      email: user.email,
      tenantName: user.tenant.name,
    });

    await logAuthEvent(user.tenantId, user.id, 'LOGIN_SUCCESS', 'Successful login');
    
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Login error', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
  
  redirect('/dashboard');
}

export async function logoutAction() {
  const { deleteSession, getSession } = await import('@/lib/auth/session');
  
  const session = await getSession();
  if (session) {
    await logAuthEvent(session.tenantId, session.userId, 'LOGOUT', 'User requested logout');
  }
  
  await deleteSession();
  redirect('/login');
}

async function logAuthEvent(tenantId: string, userId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType: 'User',
        entityId: userId,
        metadata: { message: details },
      }
    });
  } catch (e) {
    console.error('Failed to write audit log', e);
  }
}
