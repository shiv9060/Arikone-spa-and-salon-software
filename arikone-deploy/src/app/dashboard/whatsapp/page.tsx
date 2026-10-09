import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { MessageSquare, Settings, FileText, Gift, Activity, Megaphone } from "lucide-react";

export const metadata = {
  title: "WhatsApp Overview | Arikone",
};

export default async function WhatsAppOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, "WHATSAPP_VIEW")) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view WhatsApp features.</p>
      </div>
    );
  }

  // Get some metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalSent, totalFailed, totalPending] = await Promise.all([
    prisma.whatsAppLog.count({
      where: { tenantId: session.tenantId, status: "SENT" },
    }),
    prisma.whatsAppLog.count({
      where: { tenantId: session.tenantId, status: "FAILED" },
    }),
    prisma.messageJob.count({
      where: { tenantId: session.tenantId, status: "PENDING" },
    }),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WhatsApp Overview</h1>
      
      {!process.env.WHATSAPP_ACCESS_TOKEN && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-8">
          <p className="font-medium">Development / Mock Mode</p>
          <p className="text-sm">Real WhatsApp credentials are not configured. Messages will be simulated and logged, but not actually sent.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Messages Sent</p>
            <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <Activity className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Messages Failed</p>
            <p className="text-2xl font-bold text-gray-900">{totalFailed}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Messages Pending</p>
            <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {hasPermission(session.role, "WHATSAPP_SETTINGS") && (
          <Link href="/dashboard/whatsapp/settings" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex items-center flex-col text-center">
            <Settings className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium text-gray-900">Settings</span>
          </Link>
        )}
        
        <Link href="/dashboard/whatsapp/templates" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex items-center flex-col text-center">
          <FileText className="h-8 w-8 text-gray-400 mb-2" />
          <span className="font-medium text-gray-900">Templates</span>
        </Link>
        
        <Link href="/dashboard/whatsapp/logs" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex items-center flex-col text-center">
          <Activity className="h-8 w-8 text-gray-400 mb-2" />
          <span className="font-medium text-gray-900">Message Logs</span>
        </Link>

        {hasPermission(session.role, "WHATSAPP_CAMPAIGNS_VIEW") && (
          <Link href="/dashboard/whatsapp/campaigns" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex items-center flex-col text-center">
            <Megaphone className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium text-gray-900">Campaigns</span>
          </Link>
        )}
        
        {hasPermission(session.role, "BIRTHDAY_CAMPAIGNS_VIEW") && (
          <Link href="/dashboard/whatsapp/birthdays" className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex items-center flex-col text-center">
            <Gift className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium text-gray-900">Birthday Campaigns</span>
          </Link>
        )}
      </div>
    </div>
  );
}
