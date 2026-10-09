import { getCurrentUser } from '@/lib/auth/auth-utils';
import { 
  getDashboardStats, 
  getUpcomingAppointments, 
  getTopServices, 
  getStaffPerformance, 
  getRecentActivity 
} from '@/services/dashboard.service';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UpcomingAppointments } from '@/components/dashboard/upcoming-appointments';
import { TopServices } from '@/components/dashboard/top-services';
import { StaffPerformance } from '@/components/dashboard/staff-performance';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { hasPermission, RoleType } from '@/lib/auth/permissions';
import { 
  IndianRupee, 
  Calendar, 
  Users, 
  UserPlus, 
  Clock, 
  FileText 
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  
  // Parallel data fetching for performance
  const [
    stats,
    upcomingAppointments,
    topServices,
    staffPerformance,
    recentActivity
  ] = await Promise.all([
    getDashboardStats(user.tenantId, now),
    getUpcomingAppointments(user.tenantId, now),
    getTopServices(user.tenantId, now),
    getStaffPerformance(user.tenantId, now),
    getRecentActivity(user.tenantId),
  ]);

  const canViewFinancials = hasPermission(user.role as RoleType, 'REPORTS_FINANCIAL');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Good morning, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening at {user.tenantName} today.
        </p>
      </div>

      <QuickActions role={user.role} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canViewFinancials && (
          <KpiCard
            title="Today's Revenue"
            value={`₹${stats.todayRevenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
            description="Generated today"
            trend="neutral"
          />
        )}
        <KpiCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          description="Scheduled for today"
        />
        <KpiCard
          title="Today's Customers"
          value={stats.todayCustomers}
          icon={Users}
          description="Unique visits today"
        />
        <KpiCard
          title="New Customers"
          value={stats.newCustomers}
          icon={UserPlus}
          description="Registered today"
        />
        {canViewFinancials && (
          <KpiCard
            title="Pending Payments"
            value={`₹${stats.pendingPayments.toLocaleString('en-IN')}`}
            icon={Clock}
            description="Total outstanding"
          />
        )}
        {canViewFinancials && (
          <KpiCard
            title="Total Bills"
            value={stats.totalBills}
            icon={FileText}
            description="Generated today"
          />
        )}
      </div>

      {/* Main Content Grids */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-96">
          <UpcomingAppointments appointments={upcomingAppointments} />
        </div>
        
        {canViewFinancials ? (
          <div className="h-96">
            <TopServices services={topServices} />
          </div>
        ) : (
          <div className="h-96">
            <RecentActivity activities={recentActivity} />
          </div>
        )}
      </div>

      {/* Secondary Content Grids */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {canViewFinancials && (
          <div className="h-96">
            <StaffPerformance staff={staffPerformance} />
          </div>
        )}
        {canViewFinancials && (
          <div className="h-96">
            <RecentActivity activities={recentActivity} />
          </div>
        )}
      </div>
    </div>
  );
}
