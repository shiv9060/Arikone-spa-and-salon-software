'use server';

import { z } from 'zod';
import * as argon2 from 'argon2';
import prisma from '@/lib/db/prisma';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { RoleType } from '@/lib/auth/permissions';

const registerSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name is required' }),
  ownerName: z.string().min(2, { message: 'Your name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type RegisterState = {
  error?: string;
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

export async function registerAction(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const businessName = formData.get('businessName') as string;
  const ownerName = formData.get('ownerName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const parsed = registerSchema.safeParse({ businessName, ownerName, email, password });
  
  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Invalid input' };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: parsed.data.email }
    });

    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    let slug = slugify(parsed.data.businessName);
    const existingTenant = await prisma.tenant.findUnique({ where: { slug }});
    if (existingTenant) {
      slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    const passwordHash = await argon2.hash(parsed.data.password);

    const newTenant = await prisma.tenant.create({
      data: {
        name: parsed.data.businessName,
        slug,
        email: parsed.data.email,
        settings: {
          create: {}
        },
        users: {
          create: {
            name: parsed.data.ownerName,
            email: parsed.data.email,
            passwordHash,
            role: 'OWNER',
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = newTenant.users[0];

    await createSession({
      userId: user.id,
      tenantId: user.tenantId,
      role: 'OWNER' as RoleType,
      name: user.name,
      email: user.email,
      tenantName: newTenant.name,
    });

  } catch (error) {
    console.error('Register error', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
  
  redirect('/dashboard');
}
