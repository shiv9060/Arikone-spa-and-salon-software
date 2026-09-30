'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INVOICE_STATUSES = ['ALL', 'DRAFT', 'FINALIZED', 'CANCELLED'];
const PAYMENT_STATUSES = ['ALL', 'PENDING', 'PARTIAL', 'PAID'];

export function BillingFilters({
  defaultSearch,
  defaultStatus,
  defaultPaymentStatus
}: {
  defaultSearch: string;
  defaultStatus: string;
  defaultPaymentStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const [status, setStatus] = useState(defaultStatus);
  const [paymentStatus, setPaymentStatus] = useState(defaultPaymentStatus);

  const applyFilters = useCallback(
    (s: string, st: string, pst: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (s) params.set('search', s);
      else params.delete('search');
      
      if (st && st !== 'ALL') params.set('status', st);
      else params.delete('status');

      if (pst && pst !== 'ALL') params.set('paymentStatus', pst);
      else params.delete('paymentStatus');

      params.set('page', '1');
      router.push(`/dashboard/billing?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number, customer..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters(search, status, paymentStatus);
            }}
            onBlur={() => applyFilters(search, status, paymentStatus)}
          />
        </div>

        <Select value={status} onValueChange={(val: string | null) => { 
          const newValue = val || 'ALL';
          setStatus(newValue); 
          applyFilters(search, newValue, paymentStatus); 
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Invoice Status" />
          </SelectTrigger>
          <SelectContent>
            {INVOICE_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentStatus} onValueChange={(val: string | null) => { 
          const newValue = val || 'ALL';
          setPaymentStatus(newValue); 
          applyFilters(search, status, newValue); 
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Payments' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
