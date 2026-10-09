import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default async function AdminWebhooksPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const webhooks = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhook Monitoring</h1>
          <p className="text-gray-500">Monitor incoming webhooks from external providers.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Provider</th>
              <th className="px-6 py-3">Event Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Received At</th>
              <th className="px-6 py-3">Event ID</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((hook) => (
              <tr key={hook.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{hook.provider}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline">{hook.eventType}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={
                    hook.status === 'PROCESSED' ? 'default' :
                    hook.status === 'FAILED' ? 'destructive' :
                    hook.status === 'PENDING' ? 'outline' : 'secondary'
                  } className={hook.status === 'PROCESSED' ? 'bg-green-500' : ''}>
                    {hook.status}
                  </Badge>
                  {hook.errorMessage && (
                    <p className="text-xs text-red-500 mt-1 truncate max-w-[200px]">{hook.errorMessage}</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(hook.createdAt), 'MMM d, yyyy HH:mm:ss')}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  {hook.eventId}
                </td>
                <td className="px-6 py-4">
                  {hook.status === 'FAILED' && (
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-3 w-3" /> Retry
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            
            {webhooks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No webhooks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
