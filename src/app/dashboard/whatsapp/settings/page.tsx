import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db/prisma";
import { WhatsAppSettingsForm } from "./whatsapp-settings-form";

export const metadata = {
  title: "WhatsApp Settings | Arikone",
};

export default async function WhatsAppSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, "WHATSAPP_SETTINGS")) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view WhatsApp settings.</p>
      </div>
    );
  }

  const [tenant, offersRes] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: { settings: true },
    }),
    import('@/services/offer.service').then(m => m.getOffers(session.tenantId, { status: 'ACTIVE', limit: 100 }))
  ]);

  if (!tenant || !tenant.settings) {
    return <div>Tenant settings not found</div>;
  }

  const settings = tenant.settings.whatsappSettings as any || {
    enabled: false,
    appointmentConfirmationEnabled: false,
    appointmentRemindersEnabled: false,
    cancellationMessagesEnabled: false,
    birthdayMessagesEnabled: false,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WhatsApp Settings</h1>
      <p className="text-gray-500 mb-8">
        Configure automated WhatsApp messages for your business.
        {!process.env.WHATSAPP_ACCESS_TOKEN && (
          <span className="ml-2 text-amber-600 font-medium">
            (Development / Mock Mode active)
          </span>
        )}
      </p>
      <WhatsAppSettingsForm initialData={settings} offers={offersRes.data} />
    </div>
  );
}
