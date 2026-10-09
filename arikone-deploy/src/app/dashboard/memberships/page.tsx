import { requirePermission } from '@/lib/auth/auth-utils';
import { getMembershipPlans } from '@/services/membership.service';
import { Plus, Crown } from 'lucide-react';
import Link from 'next/link';

export default async function MembershipsPage({ searchParams }: { searchParams: { page?: string, search?: string } }) {
  const session = await requirePermission('MEMBERSHIPS_VIEW');
  const page = parseInt(searchParams.page || '1');
  
  const { plans, totalPages } = await getMembershipPlans(session.tenantId, { search: searchParams.search }, page);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Memberships
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Manage membership plans and active subscribers</p>
        </div>
        <Link
          href="/dashboard/memberships/new"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Plan Name</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Duration</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Discount</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Active Members</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-gray-900 dark:text-white">{plan.name}</p>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">₹{plan.price.toString()}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {plan.durationValue} {plan.durationUnit}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {plan.discountPercentage ? `${plan.discountPercentage}%` : '-'}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {plan._count.customerMemberships}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No membership plans found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
