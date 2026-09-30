'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

export function ReportFilters({ defaultPeriod = 'this_month' }: { defaultPeriod?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<string>(searchParams.get('period') || defaultPeriod);
  const [start, setStart] = useState<string>(searchParams.get('start') || '');
  const [end, setEnd] = useState<string>(searchParams.get('end') || '');

  const applyFilters = useCallback(
    (newPeriod: string, newStart?: string, newEnd?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      params.set('period', newPeriod);
      
      if (newPeriod === 'custom') {
        if (newStart) params.set('start', newStart);
        if (newEnd) params.set('end', newEnd);
      } else {
        params.delete('start');
        params.delete('end');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row items-end gap-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2 w-full sm:w-auto">
        <Label>Date Range</Label>
        <Select 
          value={period} 
          onValueChange={(val) => {
            setPeriod(val || '');
            if (val !== 'custom') applyFilters(val || '');
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {period === 'custom' && (
        <>
          <div className="space-y-2 w-full sm:w-auto">
            <Label>Start Date</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2 w-full sm:w-auto">
            <Label>End Date</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button 
            className="w-full sm:w-auto" 
            onClick={() => applyFilters(period, start, end)}
            disabled={!start || !end || start > end}
          >
            Apply Range
          </Button>
        </>
      )}
    </div>
  );
}
