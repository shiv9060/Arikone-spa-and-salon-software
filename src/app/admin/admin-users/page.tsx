import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const admins = await prisma.platformAdmin.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-gray-500">Manage Arikone platform administrators.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Login</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{admin.name}</td>
                <td className="px-6 py-4">{admin.email}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline">{admin.role}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={admin.status === 'ACTIVE' ? 'default' : 'destructive'} 
                    className={admin.status === 'ACTIVE' ? 'bg-green-500' : ''}>
                    {admin.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.lastLoginAt ? format(new Date(admin.lastLoginAt), 'MMM d, yyyy HH:mm') : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(admin.createdAt), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
            
            {admins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No administrators found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
