import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { CampaignWizard } from "@/components/whatsapp/campaign-wizard";

export const metadata = {
  title: "Create WhatsApp Campaign | Arikone",
};

export default async function NewCampaignPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.role, "WHATSAPP_CAMPAIGNS_CREATE")) {
    redirect("/dashboard/whatsapp/campaigns");
  }

  // Fetch available templates (only active ones)
  const templates = await prisma.messageTemplate.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    select: { id: true, name: true, content: true },
  });

  // Fetch active offers
  const today = new Date();
  const offers = await prisma.offer.findMany({
    where: { 
      tenantId: session.tenantId,
      isActive: true,
      OR: [
        { endDate: { gte: today } }
      ]
    },
    select: { id: true, name: true, discountPercent: true, discountAmount: true },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-gray-500 text-sm mt-1">Design and schedule a new promotional WhatsApp campaign.</p>
      </div>

      <CampaignWizard templates={templates} offers={offers} />
    </div>
  );
}
