import React from "react";
import { getAppointments, getStats } from '@/app/actions';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Scissors, 
  UserPlus, 
  Clock,
  MoreVertical,
  Bell,
  Search,
  Settings,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import Link from 'next/link';

export default async function Dashboard() {
  const stats = await getStats();
  const appointments = await getAppointments();
  
  // get today's revenue (mocking calculation for now based on appts)
  const todaysRevenue = appointments.reduce((sum, appt) => sum + appt.service.price, 0);

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
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
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

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500' }}>
            <Settings size={20} />
            Settings
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500' }}>
            <LogOut size={20} />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="bg-blob"></div>
        
        {/* Header */}
        <header className="flex-between animate-fade-in" style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 className="text-3xl" style={{ marginBottom: '8px' }}>Good Morning, Sarah</h1>
            <p className="text-muted">Here is what's happening at your salon today.</p>
          </div>
          <div className="flex-center" style={{ gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search customers, bills..." 
                style={{ padding: '10px 16px 10px 40px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-card)', outline: 'none', fontFamily: 'inherit', width: '280px' }}
              />
            </div>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ccc', overflow: 'hidden', border: '2px solid var(--accent-primary)' }}>
              <img src="https://i.pravatar.cc/100?img=5" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="animate-fade-in delay-1" style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <Link href="/appointments" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={18} /> New Appointment
          </Link>
          <Link href="/customers" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            <UserPlus size={18} /> New Customer
          </Link>
          <Link href="/billing" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            <CreditCard size={18} /> Create Bill
          </Link>
        </section>

        {/* Stats Grid */}
        <section className="animate-fade-in delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} />
              </div>
            </div>
            <p className="text-muted text-sm font-medium">Total Appointments</p>
            <h2 className="text-3xl" style={{ marginTop: '4px' }}>{stats.appointmentCount}</h2>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
            </div>
            <p className="text-muted text-sm font-medium">Total Customers</p>
            <h2 className="text-3xl" style={{ marginTop: '4px' }}>{stats.customerCount}</h2>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} />
              </div>
            </div>
            <p className="text-muted text-sm font-medium">Projected Revenue</p>
            <h2 className="text-3xl" style={{ marginTop: '4px' }}>${todaysRevenue.toFixed(2)}</h2>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} />
              </div>
            </div>
            <p className="text-muted text-sm font-medium">Pending Invoices</p>
            <h2 className="text-3xl" style={{ marginTop: '4px' }}>0</h2>
          </div>

        </section>

        {/* Bottom Section */}
        <section className="animate-fade-in delay-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Upcoming Appointments */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="text-xl">Upcoming Appointments</h3>
              <Link href="/appointments" className="text-sm font-medium" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>View All</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appointments.length === 0 ? (
                <p className="text-muted text-sm text-center" style={{ padding: '24px 0' }}>No upcoming appointments today.</p>
              ) : (
                appointments.map(appt => (
                  <div key={appt.id} className="flex-between" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {appt.customer.name.charAt(0)}
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
                      <span className="badge badge-warning" style={{ display: 'inline-block', marginTop: '4px' }}>{appt.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Services */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className="text-xl" style={{ marginBottom: '24px' }}>Top Services Today</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="font-medium text-sm">Haircut & Blowdry</span>
                  <span className="font-semibold text-sm">45%</span>
                </div>
                <div style={{ height: '8px', width: '100%', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="font-medium text-sm">Balayage Color</span>
                  <span className="font-semibold text-sm">30%</span>
                </div>
                <div style={{ height: '8px', width: '100%', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '30%', height: '100%', background: '#3B82F6', borderRadius: '4px' }}></div>
                </div>
              </div>

            </div>
          </div>
          
        </section>

      </main>
    </div>
  );
}
