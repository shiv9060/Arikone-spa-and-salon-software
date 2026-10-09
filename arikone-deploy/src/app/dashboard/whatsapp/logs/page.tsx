import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db/prisma";
import { format } from "date-fns";

export const metadata = {
  title: "WhatsApp Message Logs | Arikone",
};

export default async function WhatsAppLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, "WHATSAPP_VIEW")) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view WhatsApp logs.</p>
      </div>
    );
  }

  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const where: any = { tenantId: session.tenantId };
  
  if (typeof searchParams.type === "string" && searchParams.type !== "ALL") {
    where.messageType = searchParams.type;
  }
  
  if (typeof searchParams.status === "string" && searchParams.status !== "ALL") {
    where.status = searchParams.status;
  }

  const [logs, total] = await Promise.all([
    prisma.whatsAppLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { name: true } }
      }
    }),
    prisma.whatsAppLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Message Logs</h1>
      
      {/* Simple filters placeholder - normally this would be a client component form pushing to URL */}
      <div className="mb-6 bg-white p-4 rounded-md shadow-sm border flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select className="border-gray-300 rounded-md shadow-sm text-sm" disabled>
            <option>All Types</option>
            {/* Options */}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select className="border-gray-300 rounded-md shadow-sm text-sm" disabled>
            <option>All Statuses</option>
            {/* Options */}
          </select>
        </div>
        <div className="flex items-end">
          <button className="bg-indigo-50 px-3 py-2 text-indigo-700 text-sm font-medium rounded-md" disabled>
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No message logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(log.createdAt, "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.customer?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.recipientMobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.messageType.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.status === "SENT" || log.status === "DELIVERED" ? "bg-green-100 text-green-800" : 
                          log.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="px-3 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50">Previous</a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="px-3 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50">Next</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
