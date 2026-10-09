import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getOffers } from '@/services/offer.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Tag, MoreHorizontal, Pencil, Eye, Power, PowerOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

export const metadata = {
  title: 'Offers & Coupons | Arikone',
};

export default async function OffersPage(props: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'OFFERS_VIEW')) {
    redirect('/dashboard');
  }

  const canCreate = hasPermission(session.role, 'OFFERS_CREATE');
  const canUpdate = hasPermission(session.role, 'OFFERS_UPDATE');

  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || '';
  const status = searchParams.status || '';

  const { data: offers, pagination } = await getOffers(session.tenantId, {
    page,
    limit: 10,
    search,
    status,
  });

  const getStatusBadge = (offer: any) => {
    const now = new Date();
    if (!offer.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (now > offer.endDate) return <Badge variant="destructive">Expired</Badge>;
    if (now < offer.startDate) return <Badge variant="outline" className="text-blue-500 border-blue-500">Scheduled</Badge>;
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  const getDiscountDisplay = (offer: any) => {
    if (offer.discountPercent) return `${Number(offer.discountPercent)}%`;
    if (offer.discountAmount) return `₹${Number(offer.discountAmount)}`;
    return '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers & Coupons</h1>
          <p className="text-muted-foreground">Manage discounts and promotional campaigns.</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/offers/new">
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" /> Add Offer
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b">
          <form className="flex-1 flex gap-4 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                type="search"
                placeholder="Search offers or coupons..."
                className="pl-8"
                defaultValue={search}
              />
            </div>
            <div className="w-[180px]">
              <Select name="status" defaultValue={status}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="secondary">Filter</Button>
            {(search || status) && (
              <Link href="/dashboard/offers">
                <Button type="button" variant="ghost">Clear</Button>
              </Link>
            )}
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3 font-medium">Offer Name</th>
                  <th className="px-6 py-3 font-medium">Coupon</th>
                  <th className="px-6 py-3 font-medium">Discount</th>
                  <th className="px-6 py-3 font-medium">Validity</th>
                  <th className="px-6 py-3 font-medium">Usage</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No offers found.
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{offer.name}</td>
                      <td className="px-6 py-4">
                        {offer.couponCode ? (
                          <Badge variant="outline" className="font-mono">{offer.couponCode}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{getDiscountDisplay(offer)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span>{format(new Date(offer.startDate), 'dd MMM yyyy')}</span>
                          <span className="text-muted-foreground">to {format(new Date(offer.endDate), 'dd MMM yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {offer.usageCount} {offer.usageLimit ? `/ ${offer.usageLimit}` : ''}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(offer)}</td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="p-0">
                              <Link href={`/dashboard/offers/${offer.id}`} className="flex w-full items-center px-2 py-1.5 text-sm">
                                <Eye className="h-4 w-4 mr-2" /> View
                              </Link>
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem className="p-0">
                                <Link href={`/dashboard/offers/${offer.id}/edit`} className="flex w-full items-center px-2 py-1.5 text-sm">
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Link href={pagination.page <= 1 ? '#' : `/dashboard/offers?page=${pagination.page - 1}&search=${search}&status=${status}`}>
                  <Button type="button" variant="outline" size="sm" disabled={pagination.page <= 1}>
                    Previous
                  </Button>
                </Link>
                <Link href={pagination.page >= pagination.totalPages ? '#' : `/dashboard/offers?page=${pagination.page + 1}&search=${search}&status=${status}`}>
                  <Button type="button" variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
