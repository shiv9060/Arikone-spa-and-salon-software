'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CustomerTable({ customers, pagination, userRole }: { customers: any[]  ; pagination: any /* eslint-disable-line @typescript-eslint/no-explicit-any */; userRole: string }) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No customers found.</p>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`/dashboard/customers?${params.toString()}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 hidden lg:table-cell">Visits</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                    {c.dateOfBirth && (
                      <div className="text-xs text-muted-foreground font-normal">DOB: {format(new Date(c.dateOfBirth), 'dd MMM yyyy')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.mobile}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{c.email || '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{c._count?.appointments || 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? 'default' : 'secondary'}>
                      {c.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/customers/${c.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
