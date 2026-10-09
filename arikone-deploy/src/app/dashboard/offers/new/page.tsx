import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getServices } from '@/services/service.service';
import { OfferForm } from '@/components/offers/offer-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'New Offer | Arikone',
};

export default async function NewOfferPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'OFFERS_CREATE')) {
    redirect('/dashboard/offers');
  }

  const services = await getServices(session.tenantId, undefined, true);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/offers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Offer</h1>
          <p className="text-muted-foreground">Add a new discount or coupon.</p>
        </div>
      </div>

      <OfferForm services={services} />
    </div>
  );
}
