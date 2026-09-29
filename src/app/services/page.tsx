import React from 'react';
import { getServices, createService } from '@/app/actions';
import { LayoutDashboard, Calendar, Users, Scissors, CreditCard, TrendingUp, Search, Plus, MoreVertical } from 'lucide-react';

export default async function ServicesPage() {
  const services = await getServices();

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
          <a href="/appointments" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Calendar size={20} />
            Appointments
          </a>
          <a href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-sidebar-muted)', textDecoration: 'none', fontWeight: '500', transition: '0.2s' }}>
            <Users size={20} />
            Customers
          </a>
          <a href="/services" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
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
            <h1 className="text-3xl" style={{ marginBottom: '8px' }}>Services</h1>
            <p className="text-muted">Manage your salon service catalog and pricing.</p>
          </div>
        </header>

        <section className="animate-fade-in delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="text-xl">Service Catalog</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {services.length === 0 ? (
                <p className="text-muted text-sm text-center" style={{ padding: '24px 0' }}>No services found. Add your first service!</p>
              ) : (
                services.map((s) => (
                  <div key={s.id} className="flex-between" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scissors size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{s.name}</h4>
                        <p className="text-sm text-muted">{s.category} • {s.duration} mins</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h4 className="font-semibold text-lg">${s.price.toFixed(2)}</h4>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: 'max-content' }}>
            <h3 className="text-xl" style={{ marginBottom: '24px' }}>Add New Service</h3>
            <form action={createService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Service Name</label>
                <input required type="text" name="name" placeholder="e.g. Balayage Color" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Category</label>
                <select required name="category" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="Hair">Hair</option>
                  <option value="Skin">Skin</option>
                  <option value="Nails">Nails</option>
                  <option value="Spa">Spa</option>
                  <option value="Makeup">Makeup</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label className="text-sm font-medium">Price ($)</label>
                  <input required type="number" step="0.01" name="price" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label className="text-sm font-medium">Duration (mins)</label>
                  <input required type="number" name="duration" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                <Plus size={18} /> Add Service
              </button>
            </form>
          </div>

        </section>
      </main>
    </div>
  );
}
