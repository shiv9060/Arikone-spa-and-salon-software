import React from 'react';
import { getAppointments, getCustomers, getServices } from '@/app/actions';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { LayoutDashboard, Calendar, Users, Scissors, CreditCard, TrendingUp, Plus, MoreVertical } from 'lucide-react';

export default async function AppointmentsPage() {
  const appointments = await getAppointments();
  const customers = await getCustomers();
  const services = await getServices();

  async function createAppointment(formData: FormData) {
    'use server'
    const customerId = formData.get('customerId') as string;
    const serviceId = formData.get('serviceId') as string;
    const dateString = formData.get('date') as string;
    const timeString = formData.get('time') as string;
    
    const dateTime = new Date(`${dateString}T${timeString}:00`);

    await prisma.appointment.create({
      data: {
        customerId,
        serviceId,
        staffId: 'staff-1', // Default mock staff
        date: dateTime,
        status: 'CONFIRMED'
      }
    });

    revalidatePath('/appointments');
    revalidatePath('/');
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="flex-center" style={{ gap: '12px', marginBottom: '40px', justifyContent: 'flex-start' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>
            A
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.25rem', letterSpacing: '1px' }}>ARIKONE</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
            <Calendar size={20} />
            Appointments
          </a>
          <a href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Users size={20} />
            Customers
          </a>
          <a href="/services" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Scissors size={20} />
            Services
          </a>
          <a href="/billing" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <CreditCard size={20} />
            Billing & Invoices
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="bg-blob"></div>
        
        <header className="flex-between animate-fade-in" style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 className="text-3xl" style={{ marginBottom: '8px' }}>Appointments</h1>
            <p className="text-muted">Manage scheduling and view today's calendar.</p>
          </div>
        </header>

        <section className="animate-fade-in delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="text-xl">Upcoming Appointments</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appointments.length === 0 ? (
                <p className="text-muted text-sm text-center" style={{ padding: '24px 0' }}>No appointments scheduled.</p>
              ) : (
                appointments.map((appt) => (
                  <div key={appt.id} className="flex-between" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--accent-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--border-strong)' }}>
                        {new Date(appt.date).getDate()}
                      </div>
                      <div>
                        <h4 className="font-semibold">{appt.customer.name}</h4>
                        <p className="text-sm text-muted">{appt.service.name} • {appt.service.duration} mins</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="font-semibold">
                        {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <span className="badge badge-success" style={{ display: 'inline-block', marginTop: '4px' }}>{appt.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: 'max-content' }}>
            <h3 className="text-xl" style={{ marginBottom: '24px' }}>Book Appointment</h3>
            <form action={createAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Customer</label>
                <select required name="customerId" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Service</label>
                <select required name="serviceId" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="">Select Service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label className="text-sm font-medium">Date</label>
                  <input required type="date" name="date" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label className="text-sm font-medium">Time</label>
                  <input required type="time" name="time" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
                <Calendar size={18} /> Book Appointment
              </button>
            </form>
          </div>

        </section>
      </main>
    </div>
  );
}
