import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays, subWeeks, subMonths } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function getTenantDateRange(period: string, timezone: string = 'Asia/Kolkata', customStart?: string, customEnd?: string) {
  const now = new Date();
  // Get current time in tenant's timezone
  const tenantNow = toZonedTime(now, timezone);

  let start: Date;
  let end: Date;

  switch (period) {
    case 'today':
      start = startOfDay(tenantNow);
      end = endOfDay(tenantNow);
      break;
    case 'yesterday':
      const yesterday = subDays(tenantNow, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case 'this_week':
      start = startOfWeek(tenantNow, { weekStartsOn: 1 });
      end = endOfWeek(tenantNow, { weekStartsOn: 1 });
      break;
    case 'last_week':
      const lastWeek = subWeeks(tenantNow, 1);
      start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      end = endOfWeek(lastWeek, { weekStartsOn: 1 });
      break;
    case 'this_month':
      start = startOfMonth(tenantNow);
      end = endOfMonth(tenantNow);
      break;
    case 'last_month':
      const lastMonth = subMonths(tenantNow, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    case 'this_quarter':
      start = startOfQuarter(tenantNow);
      end = endOfQuarter(tenantNow);
      break;
    case 'custom':
      if (customStart && customEnd) {
        start = startOfDay(new Date(customStart));
        end = endOfDay(new Date(customEnd));
      } else {
        start = startOfMonth(tenantNow);
        end = endOfMonth(tenantNow);
      }
      break;
    default:
      start = startOfMonth(tenantNow);
      end = endOfMonth(tenantNow);
  }

  // Convert the local boundary boundaries back to absolute dates for querying Prisma
  // We actually don't need to do anything special here because date-fns handles this reasonably 
  // well if we just treat them as UTC limits. But wait, `tenantNow` creates a date object shifted by offset.
  // Better approach:
  // Use strings to construct correct local boundaries and parse as UTC?
  // Let's keep it simple: date-fns-tz's toZonedTime creates a Date object that LOOKS like local time.
  // We can format it back with timezone.
  
  // A robust way to construct absolute start and end times given a timezone:
  const offsetStartStr = formatInTimeZone(start, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  const offsetEndStr = formatInTimeZone(end, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");

  return {
    startDate: new Date(offsetStartStr),
    endDate: new Date(offsetEndStr),
    label: period
  };
}
