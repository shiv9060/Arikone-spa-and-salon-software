'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUSES = ['ALL', 'NEW', 'CONFIRMED', 'ARRIVED', 'SERVICE_STARTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

export function AppointmentFilters({
  defaultSearch,
  defaultStatus,
  defaultStaffId,
  defaultDate,
  view,
  staffMembers,
  userRole
}: {
  defaultSearch: string;
  defaultStatus: string;
  defaultStaffId: string;
  defaultDate: string;
  view: string;
  staffMembers: any[];
  userRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const [status, setStatus] = useState(defaultStatus);
  const [staffId, setStaffId] = useState(defaultStaffId);
  const [date, setDate] = useState(defaultDate);

  const applyFilters = useCallback(
    (s: string, st: string, sid: string, d: string, v: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (s) params.set('search', s);
      else params.delete('search');
      
      if (st && st !== 'ALL') params.set('status', st);
      else params.delete('status');

      if (sid && sid !== 'ALL') params.set('staffId', sid);
      else params.delete('staffId');

      if (d) params.set('date', d);
      else params.delete('date');

      if (v) params.set('view', v);

      params.set('page', '1');
      router.push(`/dashboard/appointments?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={view} onValueChange={(v) => applyFilters(search, status, staffId, date, v)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <Input 
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                applyFilters(search, status, staffId, e.target.value, view);
              }}
              className="w-[150px]"
            />
          </div>
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, mobile, service..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters(search, status, staffId, date, view);
            }}
            onBlur={() => applyFilters(search, status, staffId, date, view)}
          />
        </div>

        <Select value={status} onValueChange={(val: string | null) => { setStatus(val || 'ALL'); applyFilters(search, val || 'ALL', staffId, date, view); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {userRole !== 'STAFF' && (
          <Select value={staffId} onValueChange={(val: string | null) => { setStaffId(val || 'ALL'); applyFilters(search, status, val || 'ALL', date, view); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Staff</SelectItem>
              {staffMembers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
