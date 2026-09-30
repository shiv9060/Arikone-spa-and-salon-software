import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getAppointmentById } from '@/services/appointment.service';
import { AppointmentStatusActions } from '@/components/appointments/appointment-status-actions';
import { ArrowLeft, CalendarIcon, Clock, User, Scissors, PenTool, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/db/prisma';

export default async function ViewAppointmentPage(props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'APPOINTMENTS_VIEW')) {
    redirect('/dashboard');
  }

  const appointment = await getAppointmentById(session.tenantId, params.appointmentId);
  if (!appointment) redirect('/dashboard/appointments');

  const feedbackRequest = await prisma.feedbackRequest.findUnique({
    where: { tenantId_appointmentId: { tenantId: session.tenantId, appointmentId: appointment.id } },
    include: { feedback: true }
  });

  const canEdit = hasPermission(session.role, 'APPOINTMENTS_UPDATE');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard/appointments" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Appointment Details
            <Badge variant={appointment.status === 'COMPLETED' ? 'default' : appointment.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-sm">
              {appointment.status}
            </Badge>
          </h1>
        </div>
        <AppointmentStatusActions appointment={appointment} userRole={session.role} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Schedule</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mt-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(appointment.appointmentDate), 'EEEE, MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(appointment.startTime), 'hh:mm a')} - {format(new Date(appointment.endTime!), 'hh:mm a')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Customer</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mt-2">
              <div className="font-semibold text-lg">{appointment.customer.name}</div>
              <div className="text-sm text-muted-foreground">{appointment.customer.mobile}</div>
              {appointment.customer.email && <div className="text-sm text-muted-foreground">{appointment.customer.email}</div>}
            </div>
            <Link href={`/dashboard/customers/${appointment.customer.id}`}>
              <Button variant="link" className="px-0 h-auto">View Customer Profile</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Service & Staff</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mt-2">
              <div className="font-semibold text-lg">{appointment.service.name}</div>
              <div className="text-sm text-muted-foreground">Duration: {appointment.service.durationMinutes} min | Price: ₹{appointment.service.price.toString()}</div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm font-medium">Assigned Staff</div>
              <div className="text-muted-foreground">{appointment.staff.name} ({appointment.staff.designation || 'Staff'})</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Notes & Details</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-sm">
              {appointment.notes ? (
                <p className="whitespace-pre-wrap">{appointment.notes}</p>
              ) : (
                <p className="text-muted-foreground italic">No notes provided.</p>
              )}
            </div>
            {appointment.cancellationReason && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-red-600">Cancellation Reason</div>
                <p className="text-sm mt-1">{appointment.cancellationReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Feedback & Review</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-sm">
              {!feedbackRequest ? (
                <p className="text-muted-foreground italic">Feedback not requested.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <Badge variant="outline">{feedbackRequest.status}</Badge>
                  </div>
                  {feedbackRequest.feedback && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Rating:</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < feedbackRequest.feedback!.rating ? 'fill-current' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      {feedbackRequest.feedback.comment && (
                        <div>
                          <span className="font-medium text-gray-700 block mb-1">Comment:</span>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded-md">{feedbackRequest.feedback.comment}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canEdit && !['COMPLETED', 'CANCELLED'].includes(appointment.status) && (
        <div className="flex justify-end pt-4 border-t">
          <Link href={`/dashboard/appointments/${appointment.id}/edit`}>
            <Button variant="outline">Edit Appointment</Button>
          </Link>
        </div>
      )}

      {appointment.status === 'COMPLETED' && hasPermission(session.role, 'BILLING_CREATE') && (
        <div className="flex justify-end pt-4 border-t">
          <Link href={`/dashboard/billing/new?appointmentId=${appointment.id}&customerId=${appointment.customer.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">Generate Bill</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
