'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function BillingTable({ invoices, pagination, userRole }: { invoices: any[], pagination: any, userRole: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard/billing?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      FINALIZED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || colors.DRAFT}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-orange-100 text-orange-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || colors.PENDING}>{status}</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{inv.customer.name}</div>
                    <div className="text-sm text-muted-foreground">{inv.customer.mobile}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell>{getPaymentBadge(inv.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/billing/${inv.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/api/billing/${inv.id}/pdf`} target="_blank">
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
