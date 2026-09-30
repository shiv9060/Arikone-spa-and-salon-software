import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const statusFilter = resolvedParams.status || '';
  const page = parseInt(resolvedParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ];
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-gray-500">Manage all SaaS tenants and businesses on the platform.</p>
        </div>
        <Link href="/admin/tenants/new">
          <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 rounded-t-lg">
          <form className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              name="q"
              defaultValue={query}
              type="search" 
              placeholder="Search tenants..." 
              className="pl-9 bg-white"
            />
          </form>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/admin/tenants?status=ACTIVE">
              <Badge variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Active</Badge>
            </Link>
            <Link href="/admin/tenants?status=TRIAL">
              <Badge variant={statusFilter === 'TRIAL' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Trial</Badge>
            </Link>
            <Link href="/admin/tenants?status=SUSPENDED">
              <Badge variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'} className="cursor-pointer hover:bg-gray-100">Suspended</Badge>
            </Link>
            {statusFilter && (
              <Link href="/admin/tenants" className="text-xs text-gray-500 hover:underline ml-2">Clear</Link>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Business</th>
                <th className="px-6 py-3">Owner/Contact</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div>
                      {t.name}
                      <span className="block font-normal text-xs text-gray-500">/{t.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{t.email || '-'}</span>
                      <span className="text-xs text-gray-500">{t.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {t.plan?.name || <span className="text-gray-400 italic">No Plan</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                        t.status === 'ACTIVE' ? 'default' :
                        t.status === 'TRIAL' ? 'secondary' :
                        t.status === 'SUSPENDED' ? 'destructive' : 'outline'
                      }>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(t.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/tenants/${t.id}`} className="font-medium text-purple-600 hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No tenants found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
