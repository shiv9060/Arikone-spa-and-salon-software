import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getTenantDateRange } from '@/lib/date-utils';
import prisma from '@/lib/db/prisma';
import * as xlsx from 'xlsx';
import { getCustomerReport, getAppointmentReport, getBillingReport, getRevenueReport, getPaymentModeReport, getServiceReport, getStaffReport } from '@/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'REPORTS_EXPORT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const activeTab = searchParams.get('tab') || 'summary';
    const period = searchParams.get('period') || 'this_month';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;
    const dateRange = getTenantDateRange(period as string, ((session as any).tenantTimezone || 'Asia/Kolkata') as string, customStart as string | undefined, customEnd as string | undefined);

    // Create a new workbook
    const wb = xlsx.utils.book_new();

    // Generate sheets based on the requested tab
    if (activeTab === 'customers') {
      const { table } = await getCustomerReport(session.tenantId, dateRange, 1, 100000); // fetching all for export
      const ws = xlsx.utils.json_to_sheet(table.data.map(c => ({
        'Customer Name': c.name,
        'Mobile': c.mobile || '',
        'Joined Date': c.joinedDate.toISOString().split('T')[0],
        'Total Visits': c.totalVisits,
        'Total Spending': Number(c.totalSpending),
        'Status': c.status
      })));
      xlsx.utils.book_append_sheet(wb, ws, 'Customers');
    } else if (activeTab === 'appointments') {
      const appointments = await prisma.appointment.findMany({
        where: { tenantId: session.tenantId, appointmentDate: { gte: dateRange.startDate, lte: dateRange.endDate } },
        include: { customer: true, service: true, staff: true },
        orderBy: { appointmentDate: 'desc' }
      });
      const ws = xlsx.utils.json_to_sheet(appointments.map(a => ({
        'Date': a.appointmentDate.toISOString().split('T')[0],
        'Customer': a.customer.name,
        'Service': a.service.name,
        'Staff': a.staff.name,
        'Status': a.status,
        'Notes': a.notes || ''
      })));
      xlsx.utils.book_append_sheet(wb, ws, 'Appointments');
    } else if (activeTab === 'services') {
      const servicesData = await getServiceReport(session.tenantId, dateRange);
      const ws = xlsx.utils.json_to_sheet(servicesData.map(s => ({
        'Service': s.name,
        'Category': s.category,
        'Bookings': s.bookings,
        'Completed': s.completed,
        'Revenue': s.revenue,
        'Avg Revenue': s.averageRevenue
      })));
      xlsx.utils.book_append_sheet(wb, ws, 'Services');
    } else if (activeTab === 'staff') {
      const staffData = await getStaffReport(session.tenantId, dateRange);
      const ws = xlsx.utils.json_to_sheet(staffData.map(s => ({
        'Staff Name': s.name,
        'Appointments': s.appointments,
        'Completed': s.completed,
        'Cancelled': s.cancelled,
        'No Show': s.noShow,
        'Revenue': s.revenue
      })));
      xlsx.utils.book_append_sheet(wb, ws, 'Staff');
    } else if (activeTab === 'revenue') {
      const [billing, revenue, payments] = await Promise.all([
        getBillingReport(session.tenantId, dateRange),
        getRevenueReport(session.tenantId, dateRange),
        getPaymentModeReport(session.tenantId, dateRange)
      ]);
      const summaryData = [
        { Metric: 'Gross Billing', Value: billing.grossBilling },
        { Metric: 'Discounts', Value: billing.discounts },
        { Metric: 'Net Billing', Value: billing.netBilling },
        { Metric: 'Collected Revenue', Value: revenue.metrics.revenue },
      ];
      const wsSummary = xlsx.utils.json_to_sheet(summaryData);
      xlsx.utils.book_append_sheet(wb, wsSummary, 'Revenue Summary');

      const wsPayments = xlsx.utils.json_to_sheet(
        Object.entries(payments).map(([mode, data]) => ({ 'Payment Mode': mode, 'Count': data.count, 'Amount': data.amount }))
      );
      xlsx.utils.book_append_sheet(wb, wsPayments, 'Payment Modes');
    } else {
      // Summary
      const ws = xlsx.utils.json_to_sheet([{ Info: 'Summary export not explicitly defined. Choose a specific tab to export.' }]);
      xlsx.utils.book_append_sheet(wb, ws, 'Summary');
    }

    // Write to buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Log the export
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: 'REPORT_EXPORTED_EXCEL',
        entityType: 'Report',
        description: `Exported ${activeTab} report to Excel`,
        metadata: { tab: activeTab, period }
      }
    });

    const filename = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ error: 'Failed to generate Excel export' }, { status: 500 });
  }
}
