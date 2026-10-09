import { requireAuth } from '@/lib/auth/auth-utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { hasPermission, RoleType } from '@/lib/auth/permissions';
import { getPlatformSettings } from '@/services/platform/settings.service';
import { AlertCircle } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const settings = await getPlatformSettings();
  if (settings.maintenanceEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg border">
          <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">System Maintenance</h1>
          <p className="text-gray-600 mb-6">
            {settings.maintenanceMessage || 'We are currently upgrading our systems. Please check back shortly.'}
          </p>
        </div>
      </div>
    );
  }

  // Create a safe, server-side permission checker function for the client
  // Note: we can't pass functions to client components directly, so we pass down an array of permitted routes or something.
  // Actually, wait: we can't pass a function to a client component.
  // I will refactor `sidebar.tsx` and `header.tsx` in a sec to take a list of permissions or a boolean map, OR they can remain server components if they don't need hooks. 
  // Wait, sidebar uses `usePathname`, so it must be a client component.
  // I will refactor `hasPermissionFn` to instead take `userRole: string` and evaluate it there. But role check should ideally not trust client role. It's fine to pass `role` down to Client Component just for UI logic, as long as server protects the actual routes.
  
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        tenantName={user.tenantName} 
        userRole={user.role} 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          user={user}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
