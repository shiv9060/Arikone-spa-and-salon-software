import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getCustomerStats, getCustomerById } from '@/services/customer.service';
import { getAppointments } from '@/services/appointment.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Edit, MapPin, Phone, Mail, User, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CustomerActions } from '@/components/customers/customer-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentTable } from '@/components/appointments/appointment-table';
import { BillingTable } from '@/components/billing/billing-table';
import { FeedbackTable } from '@/components/feedback/feedback-table';
import prisma from '@/lib/db/prisma';

export default async function CustomerProfilePage(props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'CUSTOMERS_VIEW')) {
    redirect('/dashboard/customers');
  }

  const [customer, stats, appointmentsRes, feedbackData] = await Promise.all([
    getCustomerById(session.tenantId, params.customerId),
    getCustomerStats(session.tenantId, params.customerId).catch(() => null),
    getAppointments(session.tenantId, { customerId: params.customerId } as any),
    prisma.customerFeedback.findMany({
      where: { tenantId: session.tenantId, customerId: params.customerId },
      include: { service: { select: { name: true } }, staff: { select: { name: true } }, customer: { select: { name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  if (!customer || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Customer not found.
      </div>
    );
  }

  const canEdit = hasPermission(session.role, 'CUSTOMERS_UPDATE');
  const canDelete = hasPermission(session.role, 'CUSTOMERS_DELETE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {customer.name}
              <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                {customer.isActive ? 'Active' : 'Archived'}
              </Badge>
            </h1>
            <p className="text-muted-foreground">Customer since {format(new Date(customer.createdAt), 'MMM yyyy')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <CustomerActions customer={customer} userRole={session.role} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.mobile}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'dd MMM yyyy') : 'No DOB provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{customer.gender ? customer.gender.toLowerCase() : 'Not specified'}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="leading-snug">{customer.address || 'No address provided'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground text-sm">Total Visits</span>
                <span className="font-semibold">{stats.totalVisits}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground text-sm">Total Spending</span>
                <span className="font-semibold">₹{stats.totalSpending.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground text-sm">Last Visit</span>
                <span className="font-semibold text-right">
                  {stats.lastVisit ? format(new Date(stats.lastVisit), 'dd MMM yyyy') : 'No visits yet'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Favourite Service</span>
                <span className="font-semibold text-right truncate max-w-[150px]">
                  {stats.favouriteService || 'No history'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity / History */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Upcoming Appointment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.upcomingAppointment ? (
                    <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg border">
                      <div className="bg-primary text-primary-foreground p-3 rounded-md text-center min-w-[70px]">
                        <div className="text-xs uppercase">{format(new Date(stats.upcomingAppointment.appointmentDate), 'MMM')}</div>
                        <div className="text-2xl font-bold">{format(new Date(stats.upcomingAppointment.appointmentDate), 'dd')}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{stats.upcomingAppointment.service?.name || 'Service'}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {format(new Date(stats.upcomingAppointment.startTime), 'hh:mm a')}</span>
                          <Badge variant="outline" className="bg-background">{stats.upcomingAppointment.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                      No upcoming appointment.
                    </div>
                  )}
                  <div className="mt-4">
                    <Link href="/dashboard/appointments/new">
                      <Button variant="outline" className="w-full">Book New Appointment</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent History</CardTitle>
                  <CardDescription>Latest appointments and billing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customer.appointments.length === 0 && customer.invoices.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No recent activity.</p>
                    ) : (
                      <>
                        {customer.appointments.map(apt => (
                          <div key={apt.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">Completed {apt.service?.name}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(apt.appointmentDate), 'dd MMM yyyy')}</p>
                            </div>
                          </div>
                        ))}
                        {customer.invoices.map(inv => (
                          <div key={inv.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">Invoice {inv.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), 'dd MMM yyyy')} • ₹{inv.total.toString()}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <AppointmentTable appointments={appointmentsRes.data} pagination={appointmentsRes.pagination} userRole={session.role} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <BillingTable 
                    invoices={customer.invoices} 
                    pagination={{ totalPages: 1, page: 1 }} 
                    userRole={session.role} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Feedback</CardTitle>
                  <CardDescription>History of feedback and ratings provided by this customer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedbackTable data={feedbackData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.notes ? (
                    <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border text-sm">
                      {customer.notes}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                      No notes available for this customer.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
