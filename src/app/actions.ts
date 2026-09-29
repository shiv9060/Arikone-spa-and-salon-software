'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  return await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createCustomer(formData: FormData) {
  const name = formData.get('name') as string;
  const mobile = formData.get('mobile') as string;
  const email = formData.get('email') as string || null;
  const notes = formData.get('notes') as string || null;

  await prisma.customer.create({
    data: { name, mobile, email, notes },
  });
  
  revalidatePath('/customers');
  revalidatePath('/');
}

export async function getServices() {
  return await prisma.service.findMany({ orderBy: { category: 'asc' } });
}

export async function createService(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const price = parseFloat(formData.get('price') as string);
  const duration = parseInt(formData.get('duration') as string);

  await prisma.service.create({
    data: { name, category, price, duration },
  });
  
  revalidatePath('/services');
  revalidatePath('/');
}

export async function getAppointments() {
  return await prisma.appointment.findMany({
    include: {
      customer: true,
      service: true,
    },
    orderBy: { date: 'asc' }
  });
}

export async function getStats() {
  const customerCount = await prisma.customer.count();
  const appointmentCount = await prisma.appointment.count();
  
  return {
    customerCount,
    appointmentCount,
  };
}
