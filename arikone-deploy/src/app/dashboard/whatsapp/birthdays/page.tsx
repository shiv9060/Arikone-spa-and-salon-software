import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db/prisma";
import { format } from "date-fns";

export const metadata = {
  title: "Birthday Campaigns | Arikone",
};

export default async function BirthdayCampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, "BIRTHDAY_CAMPAIGNS_VIEW")) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view Birthday Campaigns.</p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
  });

  // Today's birthdays
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: tenant?.timezone || "Asia/Kolkata" }));
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const birthdayCustomers = await prisma.$queryRaw<any[]>`
    SELECT id, name, mobile, "dateOfBirth", "whatsappOptOut" FROM "Customer" 
    WHERE "tenantId" = ${session.tenantId} 
    AND "isActive" = true 
    AND "mobile" IS NOT NULL
    AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
    AND EXTRACT(DAY FROM "dateOfBirth") = ${day}
  `;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Birthday Campaigns</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Today's Birthdays</h2>
            <p className="text-sm text-gray-500">Customers celebrating their birthday today ({format(today, "MMMM do")})</p>
          </div>
          {hasPermission(session.role, "BIRTHDAY_CAMPAIGNS_MANAGE") && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700" disabled>
              Send All Automatically
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {birthdayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No birthdays today.
                  </td>
                </tr>
              ) : (
                birthdayCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(customer.dateOfBirth).getFullYear()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customer.whatsappOptOut ? (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Opted Out</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50" 
                        disabled={customer.whatsappOptOut}
                      >
                        Send Greeting
                      </button>
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
