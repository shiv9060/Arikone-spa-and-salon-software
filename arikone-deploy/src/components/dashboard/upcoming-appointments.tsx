import { Badge } from "@/components/ui/badge";

export function UpcomingAppointments({
  appointments,
}: {
  appointments: {
    id: string;
    time: string;
    customerName: string;
    serviceName: string;
    staffName: string;
    status: string;
  }[];
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        <p className="text-sm text-gray-500">No upcoming appointments.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Upcoming Appointments</h3>
      </div>
      <div className="flex-1 overflow-auto">
        <ul role="list" className="divide-y divide-gray-100">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between gap-x-6 p-6">
              <div className="min-w-0">
                <div className="flex items-start gap-x-3">
                  <p className="text-sm font-semibold text-gray-900">{appointment.time}</p>
                  <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
                  <p className="truncate">{appointment.customerName}</p>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                  <p className="truncate">{appointment.serviceName}</p>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                  <p className="truncate">{appointment.staffName}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
