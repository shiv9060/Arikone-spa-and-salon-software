'use client';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';





import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function AppointmentCalendar({ appointments }: { appointments: any[] }) {
  const router = useRouter();
  const { theme } = useTheme();

  const events = appointments.map(appt => ({
    id: appt.id,
    title: `${appt.customer.name} - ${appt.service.name}`,
    start: new Date(appt.startTime),
    end: new Date(appt.endTime),
    resource: appt,
  }));

  const onSelectEvent = (event: any) => {
    router.push(`/dashboard/appointments/${event.id}`);
  };

  return (
    <div className={`bg-card border rounded-xl p-4 h-[600px] ${theme === 'dark' ? 'dark-calendar' : ''}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .dark-calendar .rbc-calendar { color: #fff; }
        .dark-calendar .rbc-off-range-bg { background: #1a1b1e; }
        .dark-calendar .rbc-today { background: #2c2e33; }
        .dark-calendar .rbc-header { border-bottom-color: #333; }
        .dark-calendar .rbc-month-view, .dark-calendar .rbc-time-view, .dark-calendar .rbc-agenda-view { border-color: #333; }
        .dark-calendar .rbc-day-bg { border-left-color: #333; }
        .dark-calendar .rbc-month-row { border-top-color: #333; }
        .dark-calendar .rbc-time-content { border-top-color: #333; }
        .dark-calendar .rbc-time-header-content { border-left-color: #333; }
        .dark-calendar .rbc-timeslot-group { border-bottom-color: #333; }
        .dark-calendar .rbc-day-slot .rbc-time-slot { border-top-color: #333; }
      `}} />
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day']}
        defaultView="week"
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
