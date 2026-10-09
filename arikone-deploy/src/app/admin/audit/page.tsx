import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { format } from 'date-fns';

export default async function AdminAuditLogsPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const logs = await prisma.auditLog.findMany({
    where: { tenantId: 'platform' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Audit Logs</h1>
        <p className="text-gray-500">View administrative actions performed across the SaaS platform.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">User ID</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                </td>
                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                  {log.userId}
                </td>
                <td className="px-6 py-4 font-medium">
                  {log.action}
                </td>
                <td className="px-6 py-4">
                  {log.entityType} ({log.entityId})
                </td>
                <td className="px-6 py-4">
                  {log.metadata ? JSON.stringify(log.metadata) : '-'}
                </td>
              </tr>
            ))}
            
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No platform audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
