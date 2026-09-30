import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getOfferById } from '@/services/offer.service';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export async function generateMetadata(props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  return {
    title: `Offer Details | Arikone`,
  };
}

export default async function OfferDetailPage(props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'OFFERS_VIEW')) {
    redirect('/dashboard/offers');
  }

  const offer = await getOfferById(session.tenantId, params.offerId);
  const canUpdate = hasPermission(session.role, 'OFFERS_UPDATE');

  const getStatusBadge = () => {
    const now = new Date();
    if (!offer.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (now > offer.endDate) return <Badge variant="destructive">Expired</Badge>;
    if (now < offer.startDate) return <Badge variant="outline" className="text-blue-500 border-blue-500">Scheduled</Badge>;
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/offers" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{offer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground">
                ID: {offer.id.split('-')[0]}
              </span>
            </div>
          </div>
        </div>
        {canUpdate && (
          <Link href={`/dashboard/offers/${offer.id}/edit`}>
            <Button type="button">
              <Pencil className="h-4 w-4 mr-2" /> Edit Offer
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Discount</p>
                <p className="font-medium">
                  {offer.discountPercent ? `${Number(offer.discountPercent)}%` : `₹${Number(offer.discountAmount)}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coupon Code</p>
                <p className="font-medium">
                  {offer.couponCode ? <Badge variant="outline" className="font-mono">{offer.couponCode}</Badge> : 'None'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minimum Bill Amount</p>
                <p className="font-medium">{offer.minimumBill ? `₹${Number(offer.minimumBill)}` : 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maximum Discount</p>
                <p className="font-medium">{offer.maximumDiscount ? `₹${Number(offer.maximumDiscount)}` : 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid From</p>
                <p className="font-medium">{format(new Date(offer.startDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">{format(new Date(offer.endDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
            
            {offer.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{offer.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Times Used</p>
                  <p className="text-3xl font-bold">{offer.usageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usage Limit</p>
                  <p className="text-3xl font-bold text-muted-foreground">
                    {offer.usageLimit ? offer.usageLimit : '∞'}
                  </p>
                </div>
              </div>
              {offer.usageLimit && offer.usageCount >= offer.usageLimit && (
                <p className="text-sm text-destructive mt-4 font-medium">This offer has reached its usage limit.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applicable Services</CardTitle>
            </CardHeader>
            <CardContent>
              {offer.applicableServices === 'ALL' ? (
                <p className="text-muted-foreground">This offer applies to all services.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {offer.offerServices.map((os) => (
                    <li key={os.serviceId}>{os.service.name}</li>
                  ))}
                  {offer.offerServices.length === 0 && (
                    <li className="text-destructive list-none -ml-5">No specific services selected.</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
