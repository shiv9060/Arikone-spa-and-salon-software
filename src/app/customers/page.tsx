import React from 'react';
import { getCustomers, createCustomer } from '@/app/actions';
import { LayoutDashboard, Calendar, Users, Scissors, CreditCard, TrendingUp, Search, Plus, MoreVertical } from 'lucide-react';

export default async function CustomersPage() {
  const customers = await getCustomers();

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
          <a href="/customers" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
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
            <h1 className="text-3xl" style={{ marginBottom: '8px' }}>Customers</h1>
            <p className="text-muted">Manage your client base and view their history.</p>
          </div>
          <div className="flex-center" style={{ gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search customers..." 
                style={{ padding: '10px 16px 10px 40px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-card)', outline: 'none', fontFamily: 'inherit', width: '280px' }}
              />
            </div>
          </div>
        </header>

        <section className="animate-fade-in delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 className="text-xl">Customer Directory</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customers.length === 0 ? (
                <p className="text-muted text-sm text-center" style={{ padding: '24px 0' }}>No customers found. Add your first customer!</p>
              ) : (
                customers.map((c) => (
                  <div key={c.id} className="flex-between" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FDFBF7', color: 'var(--accent-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--border-strong)' }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{c.name}</h4>
                        <p className="text-sm text-muted">{c.mobile} • {c.email || 'No email'}</p>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: 'max-content' }}>
            <h3 className="text-xl" style={{ marginBottom: '24px' }}>Add New Customer</h3>
            <form action={createCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Full Name</label>
                <input required type="text" name="name" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Mobile Number</label>
                <input required type="text" name="mobile" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Email (Optional)</label>
                <input type="email" name="email" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea name="notes" rows={3} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-main)', outline: 'none', fontFamily: 'inherit', resize: 'none' }}></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                <Plus size={18} /> Add Customer
              </button>
            </form>
          </div>

        </section>
      </main>
    </div>
  );
}
