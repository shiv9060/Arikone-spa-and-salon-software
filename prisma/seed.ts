import { PrismaClient, Role, StaffStatus, AppointmentStatus, InvoicePaymentStatus, PaymentMode, WhatsAppMessageType, WhatsAppMessageStatus } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database for Arikone Demo...')

  // 1. Create Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'arikone-demo' },
    update: {},
    create: {
      name: 'Arikone Demo Salon',
      slug: 'arikone-demo',
      businessType: 'SALON',
      email: 'demo@arikone.com',
      phone: '9876543210',
      address: '123 Demo Street',
      city: 'Demo City',
      state: 'Demo State',
      settings: {
        create: {
          displayName: 'Arikone Demo Salon',
          invoicePrefix: 'DEMO-',
        }
      }
    },
  })
  console.log('✅ Demo Tenant created:', tenant.name)

  // 2. Create Users (with hashed passwords)
  const passwordHash = await argon2.hash('DemoPassword123!');

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@arikone.demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Alice Owner',
      email: 'owner@arikone.demo',
      passwordHash,
      role: Role.OWNER,
    }
  })

  const manager = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'manager@arikone.demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Bob Manager',
      email: 'manager@arikone.demo',
      passwordHash,
      role: Role.MANAGER,
    }
  })

  const receptionist = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'receptionist@arikone.demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Charlie Receptionist',
      email: 'receptionist@arikone.demo',
      passwordHash,
      role: Role.RECEPTIONIST,
    }
  })

  const staff = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'staff@arikone.demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Diana Staff',
      email: 'staff@arikone.demo',
      passwordHash,
      role: Role.STAFF,
    }
  })
  
  console.log('✅ Demo Users created (Password: DemoPassword123!)')

  // 3. Create Staff
  const staff1 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      name: 'Sarah Stylist',
      mobile: '9876543211',
      designation: 'Senior Stylist',
      status: StaffStatus.ACTIVE
    }
  })
  
  const staff2 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      name: 'Mike Therapist',
      mobile: '9876543212',
      designation: 'Massage Therapist',
      status: StaffStatus.ACTIVE
    }
  })
  console.log('✅ Staff created')

  // 4. Create Service Category & Services
  const category = await prisma.serviceCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Hair Care' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Hair Care',
      description: 'All hair related services'
    }
  })

  const service1 = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: category.id,
      name: 'Premium Haircut',
      price: 1500,
      durationMinutes: 45,
      taxPercent: 18,
    }
  })

  const service2 = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      categoryId: category.id,
      name: 'Hair Spa',
      price: 2500,
      durationMinutes: 60,
      taxPercent: 18,
    }
  })
  console.log('✅ Services created')

  // 5. Create Customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Jane Doe',
      mobile: '9999999999',
      email: 'jane@example.com',
    }
  })
  console.log('✅ Customer created')

  // 6. Create Appointment
  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      serviceId: service1.id,
      staffId: staff1.id,
      appointmentDate: new Date(),
      startTime: new Date(),
      status: AppointmentStatus.CONFIRMED,
    }
  })
  console.log('✅ Appointment created')

  // 7. Create Invoice and Payment
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      appointmentId: appointment.id,
      invoiceNumber: 'DEMO-000001',
      subtotal: 1500,
      tax: 270,
      total: 1770,
      paymentStatus: InvoicePaymentStatus.PAID,
      paymentMode: PaymentMode.UPI,
      invoiceItems: {
        create: [
          {
            serviceId: service1.id,
            serviceName: service1.name,
            quantity: 1,
            unitPrice: 1500,
            taxPercent: 18,
            taxAmount: 270,
            total: 1770
          }
        ]
      },
      payments: {
        create: [
          {
            tenantId: tenant.id,
            amount: 1770,
            paymentMode: PaymentMode.UPI,
            referenceNumber: 'UPI123456789'
          }
        ]
      }
    }
  })
  console.log('✅ Invoice and Payment created')

  console.log('🎉 Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
