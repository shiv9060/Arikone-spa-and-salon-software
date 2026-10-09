'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CustomerFilters({ defaultSearch, defaultStatus, defaultSort }: { defaultSearch: string, defaultStatus: string, defaultSort: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch);
  const [status, setStatus] = useState(defaultStatus);
  const [sort, setSort] = useState(defaultSort);

  const applyFilters = (s: string, st: string, so: string) => {
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (st && st !== 'ACTIVE') params.set('status', st);
    if (so && so !== 'NEWEST') params.set('sort', so);
    
    router.push(`/dashboard/customers?${params.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== defaultSearch) {
        applyFilters(search, status, sort);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status, sort, defaultSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const _dummy = (s: string, st: string, so: string) => {
    const params = new URLSearchParams();
    if (s) params.set('search', s);
    if (st && st !== 'ACTIVE') params.set('status', st);
    if (so && so !== 'NEWEST') params.set('sort', so);
    
    router.push(`/dashboard/customers?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search name, mobile or invoice..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={status} onValueChange={(val) => { const v = val as string; setStatus(v); applyFilters(search, v, sort); }}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
          <SelectItem value="ALL">All</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(val) => { const v = val as string; setSort(v); applyFilters(search, status, v); }}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NEWEST">Newest</SelectItem>
          <SelectItem value="OLDEST">Oldest</SelectItem>
          <SelectItem value="NAME_ASC">Name (A-Z)</SelectItem>
          <SelectItem value="NAME_DESC">Name (Z-A)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
