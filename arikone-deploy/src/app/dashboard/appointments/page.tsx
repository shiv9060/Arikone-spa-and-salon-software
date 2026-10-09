import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getAppointments } from '@/services/appointment.service';
import { getStaffList } from '@/services/staff.service';
import { AppointmentTable } from '@/components/appointments/appointment-table';
import { AppointmentFilters } from '@/components/appointments/appointment-filters';
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function AppointmentsPage(props: { searchParams: Promise<{ page?: string; view?: string; search?: string; status?: string; staffId?: string; date?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'APPOINTMENTS_VIEW')) {
    redirect('/dashboard');
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const view = (searchParams.view as 'list' | 'calendar') || 'list';
  const search = searchParams.search || '';
  const status = searchParams.status || 'ALL';
  
  const staffId = searchParams.staffId || 'ALL';

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (view === 'list') {
    if (searchParams.date) {
      startDate = new Date(`${searchParams.date}T00:00:00`);
      endDate = new Date(`${searchParams.date}T23:59:59`);
    } else if (!search) {
      // Default to today if no search and no date
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    }
  } else {
    // For calendar, we fetch a larger range
    const today = new Date();
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  }

  const [appointmentsRes, staffRes] = await Promise.all([
    getAppointments(session.tenantId, {
      page: view === 'calendar' ? 1 : page,
      limit: view === 'calendar' ? 1000 : 20,
      search,
      status,
      staffId,
      startDate,
      endDate
    }),
    getStaffList(session.tenantId, undefined, 'ACTIVE')
  ]);

  const canCreate = hasPermission(session.role, 'APPOINTMENTS_CREATE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage your salon&apos;s bookings and schedules.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/appointments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Appointment
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <AppointmentFilters 
          defaultSearch={search} 
          defaultStatus={status} 
          defaultStaffId={staffId}
          defaultDate={searchParams.date || ''}
          view={view}
          staffMembers={staffRes}
          userRole={session.role}
        />
        
        {view === 'list' ? (
          <AppointmentTable 
            appointments={appointmentsRes.data} 
            pagination={appointmentsRes.pagination} 
            userRole={session.role} 
          />
        ) : (
          <AppointmentCalendar 
            appointments={appointmentsRes.data} 
          />
        )}
      </div>
    </div>
  );
}
