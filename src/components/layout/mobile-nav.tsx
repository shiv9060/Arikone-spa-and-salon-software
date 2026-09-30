'use client';

import { Menu, Scissors } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { NAVIGATION_ITEMS } from './sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

import { hasPermission, RoleType, Permission } from '@/lib/auth/permissions';

export function MobileNav({ tenantName, userRole }: { tenantName: string, userRole: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const authorizedNav = NAVIGATION_ITEMS.filter(item => 
    !item.permission || hasPermission(userRole as RoleType, item.permission as Permission)
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-gray-900 text-white p-0 border-r-gray-800">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-16 items-center px-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white" onClick={() => setOpen(false)}>
            <Scissors className="h-6 w-6 text-indigo-400" />
            <span className="text-xl">Arikone</span>
          </Link>
        </div>
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Business</div>
          <div className="mt-1 text-sm font-medium text-white truncate">{tenantName}</div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-4">
            {authorizedNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
