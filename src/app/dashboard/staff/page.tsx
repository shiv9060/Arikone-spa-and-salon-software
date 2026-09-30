import { requirePermission } from '@/lib/auth/auth-utils';
import { getStaffList } from '@/services/staff.service';
import { StaffTable } from '@/components/staff/staff-table';
import { StaffDialog } from '@/components/staff/staff-dialog';

export default async function StaffPage(
  props: {
    searchParams?: Promise<{
      q?: string;
      status?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requirePermission('STAFF_VIEW');
  
  const query = searchParams?.q || '';
  const statusFilter = searchParams?.status as 'ACTIVE' | 'INACTIVE' | undefined;
  
  const staffList = await getStaffList(user.tenantId, query, statusFilter);
  
  const canCreate = ['OWNER', 'MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team, designations, and commissions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {canCreate && <StaffDialog mode="create" />}
        </div>
      </div>
      
      {/* Search and Filters could go here in future */}
      
      <StaffTable staffList={staffList} userRole={user.role} />
    </div>
  );
}
