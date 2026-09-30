import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const notifications = await prisma.platformNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'INFO': return <Info className="h-5 w-5 text-blue-500" />;
      case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'ERROR': 
      case 'CRITICAL': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Notifications</h1>
          <p className="text-gray-500">System alerts and critical updates.</p>
        </div>
        <Button variant="outline">Mark All Read</Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className={`bg-white p-4 rounded-lg border shadow-sm flex items-start gap-4 ${!notif.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="pt-1">
              {getIcon(notif.severity)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notif.createdAt))} ago
                </span>
              </div>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <div className="pt-2 flex gap-2">
                <Badge variant="outline">{notif.type}</Badge>
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-white p-8 rounded-lg border text-center text-gray-500 shadow-sm">
            <Bell className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p>No notifications at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
