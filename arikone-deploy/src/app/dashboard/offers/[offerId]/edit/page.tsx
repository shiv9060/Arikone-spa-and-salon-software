import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getOfferById } from '@/services/offer.service';
import { getServices } from '@/services/service.service';
import { OfferForm } from '@/components/offers/offer-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Offer | Arikone',
};

export default async function EditOfferPage(props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'OFFERS_UPDATE')) {
    redirect('/dashboard/offers');
  }

  const [offer, services] = await Promise.all([
    getOfferById(session.tenantId, params.offerId),
    getServices(session.tenantId, undefined, true),
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/offers/${params.offerId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Offer</h1>
          <p className="text-muted-foreground">Modify {offer.name}.</p>
        </div>
      </div>

      <OfferForm services={services} initialData={offer} />
    </div>
  );
}
