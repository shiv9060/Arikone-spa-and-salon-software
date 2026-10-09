import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getAppointmentById } from '@/services/appointment.service';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import { getCustomers } from '@/services/customer.service';
import { getServices } from '@/services/service.service';
import { getStaffList } from '@/services/staff.service';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditAppointmentPage(props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'APPOINTMENTS_UPDATE')) {
    redirect('/dashboard/appointments');
  }

  const appointment = await getAppointmentById(session.tenantId, params.appointmentId);
  if (!appointment) redirect('/dashboard/appointments');

  const [customersRes, servicesRes, staffRes] = await Promise.all([
    getCustomers(session.tenantId, { limit: 1000, status: 'ACTIVE' }),
    getServices(session.tenantId, undefined, true),
    getStaffList(session.tenantId, undefined, 'ACTIVE')
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/appointments/${appointment.id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Appointment</h1>
          <p className="text-muted-foreground">Modify the appointment details.</p>
        </div>
      </div>

      <AppointmentForm 
        customers={customersRes.data} 
        services={servicesRes} 
        staff={staffRes} 
        appointment={appointment}
        mode="edit" 
      />
    </div>
  );
}
