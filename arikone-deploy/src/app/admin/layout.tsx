import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Header } from '@/components/layout/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userRole={session.role} />
      <div className="flex w-full flex-col">
        <Header user={{ name: session.name, email: session.email, role: session.role, tenantName: session.tenantName }} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
