'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2,
  PackageCheck,
  CreditCard,
  Activity,
  History,
  Settings,
  Scissors
} from 'lucide-react';
import { RoleType } from '@/lib/auth/permissions';

export const ADMIN_NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { name: 'Plans', href: '/admin/plans', icon: PackageCheck },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Usage', href: '/admin/usage', icon: Activity },
  { name: 'Audit Logs', href: '/admin/audit', icon: History },
  { name: 'Notifications', href: '/admin/notifications', icon: History },
  { name: 'Webhooks', href: '/admin/webhooks', icon: Activity },
  { name: 'Admin Users', href: '/admin/admin-users', icon: Settings },
  { name: 'System Health', href: '/admin/system-health', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  // Admin UI only available to SUPER_ADMIN
  if (userRole !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="hidden border-r bg-gray-900 lg:block lg:w-64 lg:shrink-0 h-screen sticky top-0 flex-col">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <Scissors className="h-6 w-6 text-purple-500" />
          <span className="text-xl">Arikone Platform</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {ADMIN_NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-purple-500/10 text-purple-400" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
