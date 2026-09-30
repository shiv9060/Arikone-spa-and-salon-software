'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Scissors,
  UserCircle,
  CreditCard,
  IndianRupee,
  BarChart3, 
  Tag,
  MessageSquare, 
  Settings,
  Crown,
  Gift,
  Package as PackageIcon,
  Star
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Customers', href: '/dashboard/customers', icon: Users, permission: 'CUSTOMERS_VIEW' },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, permission: 'APPOINTMENTS_VIEW' },
  { name: 'Services', href: '/dashboard/services', icon: Scissors, permission: 'SERVICES_VIEW' },
  { name: 'Staff', href: '/dashboard/staff', icon: UserCircle, permission: 'STAFF_VIEW' },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, permission: 'BILLING_VIEW' },
  { name: 'Payments', href: '/dashboard/payments', icon: IndianRupee, permission: 'PAYMENTS_VIEW' },
  { name: 'Memberships', href: '/dashboard/memberships', icon: Crown, permission: 'MEMBERSHIPS_VIEW' },
  { name: 'Packages', href: '/dashboard/packages', icon: PackageIcon, permission: 'PACKAGES_VIEW' },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: 'REPORTS_VIEW' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: PackageIcon, permission: 'INVENTORY_VIEW' },
  { name: 'Offers', href: '/dashboard/offers', icon: Tag, permission: 'OFFERS_VIEW' },
  { name: 'Expenses', href: '/dashboard/expenses', icon: IndianRupee, permission: 'EXPENSES_VIEW' },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare, permission: 'WHATSAPP_VIEW' },
  { name: 'Feedback', href: '/dashboard/feedback', icon: Star, permission: 'FEEDBACK_VIEW' },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard, permission: 'SUBSCRIPTION_VIEW' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'SETTINGS_VIEW' },
];

import { hasPermission, RoleType, Permission } from '@/lib/auth/permissions';

export function Sidebar({ tenantName, userRole }: { 
  tenantName: string, 
  userRole: string
}) {
  const pathname = usePathname();

  const authorizedNav = NAVIGATION_ITEMS.filter(item => 
    !item.permission || hasPermission(userRole as RoleType, item.permission as Permission)
  );

  return (
    <div className="hidden border-r bg-gray-900 lg:block lg:w-64 lg:shrink-0 h-screen sticky top-0 flex-col">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <Scissors className="h-6 w-6 text-indigo-400" />
          <span className="text-xl">Arikone</span>
        </Link>
      </div>
      
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Business</div>
        <div className="mt-1 text-sm font-medium text-white truncate" title={tenantName}>
          {tenantName}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {authorizedNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
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
