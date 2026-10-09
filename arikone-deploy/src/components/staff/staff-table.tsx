'use client';

import { Badge } from '@/components/ui/badge';
import { StaffDialog } from './staff-dialog';
import { Button } from '@/components/ui/button';
import { deactivateStaffAction } from '@/app/dashboard/staff/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function StaffTable({ staffList, userRole }: { staffList: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */; userRole: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Checking permissions basic on client (server handles real security)
  const canEdit = ['OWNER', 'MANAGER'].includes(userRole);
  
  const handleDeactivate = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member? They will not appear for new appointments.')) return;
    
    setLoading(staffId);
    try {
      const result = await deactivateStaffAction(staffId);
      if (result?.success) {
        toast({ title: 'Success', description: 'Staff member deactivated.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to deactivate.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role/Designation</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {staffList.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                No staff members found.
              </td>
            </tr>
          ) : (
            staffList.map((staff) => (
              <tr key={staff.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                  {staff.joiningDate && (
                    <div className="text-xs text-gray-500">Joined: {new Date(staff.joiningDate).toLocaleDateString()}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{staff.mobile || '-'}</div>
                  <div className="text-sm text-gray-500">{staff.email || '-'}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {staff.designation || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant={staff.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {staff.status}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    {canEdit && <StaffDialog mode="edit" staff={staff} />}
                    {canEdit && staff.status === 'ACTIVE' && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeactivate(staff.id)}
                        disabled={loading === staff.id}
                      >
                        {loading === staff.id ? '...' : 'Deactivate'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
