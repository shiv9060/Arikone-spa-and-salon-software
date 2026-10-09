import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getTenantDateRange } from '@/lib/date-utils';
import prisma from '@/lib/db/prisma';
import PDFDocument from 'pdfkit';
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
    const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const buildPdf = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(20).text(tenant?.name || 'Arikone Business', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Report: ${activeTab.toUpperCase()}`, { align: 'center' });
    doc.fontSize(10).text(`Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    if (activeTab === 'summary' || activeTab === 'revenue') {
      const [billing, revenue] = await Promise.all([
        getBillingReport(session.tenantId, dateRange),
        getRevenueReport(session.tenantId, dateRange),
      ]);
      
      doc.fontSize(14).text('Financial Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`Gross Billing: ${billing.grossBilling}`)
         .text(`Discounts: ${billing.discounts}`)
         .text(`Net Billing: ${billing.netBilling}`)
         .text(`Collected Revenue: ${revenue.metrics.revenue}`)
         .text(`Outstanding: ${revenue.metrics.outstanding}`);
    } else if (activeTab === 'customers') {
      const { metrics } = await getCustomerReport(session.tenantId, dateRange, 1, 10);
      doc.fontSize(14).text('Customers Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`New Customers: ${metrics.newCustomers}`)
         .text(`Active Customers: ${metrics.activeCustomers}`)
         .text(`Archived Customers: ${metrics.archivedCustomers}`);
    } else if (activeTab === 'appointments') {
      const { metrics } = await getAppointmentReport(session.tenantId, dateRange);
      doc.fontSize(14).text('Appointments Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`Total Appointments: ${metrics.total}`)
         .text(`Completed: ${metrics.completed}`)
         .text(`Cancelled: ${metrics.cancelled}`)
         .text(`No Shows: ${metrics.noShow}`)
         .text(`Completion Rate: ${metrics.completionRate.toFixed(1)}%`);
    } else if (activeTab === 'services') {
      const services = await getServiceReport(session.tenantId, dateRange);
      doc.fontSize(14).text('Top Services', { underline: true });
      doc.moveDown(0.5);
      services.sort((a,b) => b.revenue - a.revenue).slice(0, 15).forEach(s => {
        doc.fontSize(10).text(`${s.name} - ${s.bookings} bookings - Revenue: ${s.revenue}`);
      });
    } else if (activeTab === 'staff') {
      const staff = await getStaffReport(session.tenantId, dateRange);
      doc.fontSize(14).text('Staff Performance', { underline: true });
      doc.moveDown(0.5);
      staff.sort((a,b) => b.completed - a.completed).forEach(s => {
        doc.fontSize(10).text(`${s.name} - ${s.completed} completed - Revenue: ${s.revenue}`);
      });
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('grey').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    
    doc.end();

    const pdfBuffer = await buildPdf;

    // Log the export
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: 'REPORT_EXPORTED_PDF',
        entityType: 'Report',
        description: `Exported ${activeTab} report to PDF`,
        metadata: { tab: activeTab, period }
      }
    });

    const filename = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF export' }, { status: 500 });
  }
}
