import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getSystemHealth } from '@/services/platform/health.service';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Server, Mail, MessageSquare } from 'lucide-react';
import prisma from '@/lib/db/prisma';
import { formatDistanceToNow } from 'date-fns';

export default async function SystemHealthPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const health = await getSystemHealth();
  
  // Jobs health mock/real (We check WebhookEvent as a proxy for job health)
  const failedWebhooksCount = await prisma.webhookEvent.count({
    where: { status: 'FAILED' }
  });
  
  const pendingWebhooksCount = await prisma.webhookEvent.count({
    where: { status: 'PENDING' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-gray-500">Monitor Arikone infrastructure components.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core App */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">Application</h3>
            </div>
            <Badge variant="default" className="bg-green-500">RUNNING</Badge>
          </div>
          <div className="text-sm text-gray-500">
            Last Checked: {formatDistanceToNow(new Date(health.timestamp))} ago
          </div>
        </div>

        {/* Database */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">Database</h3>
            </div>
            <Badge variant={health.services.database.status === 'CONNECTED' ? 'default' : 'destructive'} 
              className={health.services.database.status === 'CONNECTED' ? 'bg-green-500' : ''}>
              {health.services.database.status}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Latency: {health.services.database.latencyMs}ms
          </div>
        </div>

        {/* Email */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">Email Service</h3>
            </div>
            <Badge variant="default" className="bg-green-500">READY</Badge>
          </div>
          <div className="text-sm text-gray-500">
            Provider: Mock/Configured
          </div>
        </div>
        
        {/* Webhooks / Jobs */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">Background Jobs</h3>
            </div>
            <Badge variant={failedWebhooksCount > 0 ? 'destructive' : 'default'} className={failedWebhooksCount === 0 ? 'bg-green-500' : ''}>
              {failedWebhooksCount > 0 ? 'ATTENTION' : 'HEALTHY'}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Pending Tasks: {pendingWebhooksCount} <br />
            Failed Tasks: {failedWebhooksCount}
          </div>
        </div>
      </div>
    </div>
  );
}
