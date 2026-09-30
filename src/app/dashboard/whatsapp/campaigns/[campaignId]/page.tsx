import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Users, Calendar, Activity, MessageSquare, Tag, PieChart } from "lucide-react";

export async function generateMetadata(props: { params: Promise<{ campaignId: string }> }) {
  return { title: "Campaign Details | Arikone" };
}

export default async function CampaignDetailsPage(props: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.role, "WHATSAPP_CAMPAIGNS_VIEW")) {
    redirect("/dashboard/whatsapp/campaigns");
  }

  const { campaignId } = await props.params;

  const campaign = await prisma.whatsAppCampaign.findUnique({
    where: { id: campaignId, tenantId: session.tenantId },
    include: {
      template: true,
      offer: true,
      // Just getting a small sample of recipients for display
      recipients: {
        take: 10,
        include: {
          customer: { select: { name: true, mobile: true } },
        }
      }
    }
  });

  if (!campaign) notFound();
  
  const campaignData = campaign as any;

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    QUEUED: 'bg-yellow-100 text-yellow-800',
    SCHEDULED: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  const deliveryRate = campaign.totalRecipients > 0 
    ? Math.round((campaign.deliveredCount / campaign.totalRecipients) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/whatsapp/campaigns" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.DRAFT}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Created on {format(new Date(campaign.createdAt), "PPP")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h3 className="font-medium text-gray-900">Total Audience</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{campaign.totalRecipients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-green-500" />
            <h3 className="font-medium text-gray-900">Delivered</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{campaign.deliveredCount}</p>
          <p className="text-sm text-gray-500 mt-1">{deliveryRate}% delivery rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-gray-900">Failed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{campaign.failedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Campaign Settings</h2>
          
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3">
              <span className="text-gray-500 font-medium">Type</span>
              <span className="col-span-2 text-gray-900">{campaign.campaignType}</span>
            </div>
            
            <div className="grid grid-cols-3">
              <span className="text-gray-500 font-medium">Schedule</span>
              <span className="col-span-2 text-gray-900">
                {campaign.scheduledAt 
                  ? format(new Date(campaign.scheduledAt), "PPP 'at' p") 
                  : 'Immediate'}
              </span>
            </div>

            <div className="grid grid-cols-3">
              <span className="text-gray-500 font-medium">Offer Attached</span>
              <span className="col-span-2 text-gray-900">
                {campaignData.offer ? (
                  <Link href={`/dashboard/offers`} className="text-indigo-600 hover:underline flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {campaignData.offer.name}
                  </Link>
                ) : 'None'}
              </span>
            </div>

            <div className="grid grid-cols-3 pt-4 border-t border-gray-100">
              <span className="text-gray-500 font-medium">Audience Filter</span>
              <span className="col-span-2 text-gray-900 break-words">
                <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(campaign.audienceDefinition, null, 2)}</pre>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Message Content</h2>
          {campaignData.template ? (
            <>
              <p className="text-sm font-medium text-gray-700 mb-2">Template: {campaignData.template.name}</p>
              <div className="bg-[#EFEAE2] p-4 rounded-lg relative flex-grow">
                <div className="bg-white p-3 rounded-md shadow-sm rounded-tr-none text-sm text-gray-800 whitespace-pre-wrap max-w-[85%] relative z-10">
                  {campaignData.template.content}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic text-sm">Template deleted or not found.</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sample Recipients (10 max)</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaignData.recipients.map((recipient: any) => (
              <tr key={recipient.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {recipient.customer.name}
                </td>
                <td className="px-6 py-3 text-gray-500">{recipient.customer.mobile}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                    ${recipient.status === 'DELIVERED' ? 'text-green-700 bg-green-50' :
                      recipient.status === 'FAILED' ? 'text-red-700 bg-red-50' :
                      'text-gray-700 bg-gray-100'}`}>
                    {recipient.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
