import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, Calendar, Users, Activity, Trash2 } from "lucide-react";
import { getCampaigns } from "./actions";
import { format } from "date-fns";

export const metadata = {
  title: "WhatsApp Campaigns | Arikone",
};

export default async function CampaignsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.role, "WHATSAPP_CAMPAIGNS_VIEW")) {
    redirect("/dashboard/whatsapp");
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const { campaigns, total } = await getCampaigns(page, 10);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and send targeted promotional campaigns.</p>
        </div>
        {hasPermission(session.role, "WHATSAPP_CAMPAIGNS_CREATE") && (
          <Link
            href="/dashboard/whatsapp/campaigns/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Megaphone className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">No campaigns found</p>
                      <p className="mt-1">Create your first campaign to start engaging with customers.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        Type: {campaign.campaignType.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'QUEUED' || campaign.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                        campaign.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Users className="h-4 w-4 text-gray-400" />
                        {campaign.totalRecipients} recipients
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between w-32">
                          <span>Sent:</span>
                          <span className="font-medium">{campaign.sentCount}</span>
                        </div>
                        <div className="flex justify-between w-32">
                          <span>Delivered:</span>
                          <span className="font-medium text-green-600">{campaign.deliveredCount}</span>
                        </div>
                        <div className="flex justify-between w-32">
                          <span>Failed:</span>
                          <span className="font-medium text-red-600">{campaign.failedCount}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/whatsapp/campaigns/${campaign.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm mr-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
