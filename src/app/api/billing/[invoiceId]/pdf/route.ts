import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { getInvoiceById } from '@/services/billing.service';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params;
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'BILLING_VIEW')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const invoice = await getInvoiceById(session.tenantId, invoiceId);

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    const stream = new ReadableStream({
      start(controller) {
        doc.on('data', (chunk) => controller.enqueue(chunk));
        doc.on('end', () => controller.close());

        // Header
        doc.fontSize(20).text(invoice.businessNameSnapshot || 'Invoice', { align: 'center' });
        doc.moveDown();
        if (invoice.businessAddressSnapshot) {
          doc.fontSize(10).text(invoice.businessAddressSnapshot, { align: 'center' });
        }
        doc.moveDown(2);

        // Invoice Details
        doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString()}`);
        doc.text(`Status: ${invoice.status}`);
        doc.text(`Payment Status: ${invoice.paymentStatus}`);
        
        doc.moveUp(4);
        doc.text(`Customer: ${invoice.customerNameSnapshot || invoice.customer.name}`, { align: 'right' });
        doc.text(`Mobile: ${invoice.customerMobileSnapshot || invoice.customer.mobile}`, { align: 'right' });
        doc.moveDown(3);

        // Table Header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Service', 50, tableTop);
        doc.text('Qty', 250, tableTop, { width: 40, align: 'right' });
        doc.text('Price', 300, tableTop, { width: 70, align: 'right' });
        doc.text('Discount', 380, tableTop, { width: 70, align: 'right' });
        doc.text('Total', 470, tableTop, { width: 70, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
        doc.font('Helvetica');

        let y = tableTop + 25;

        // Table Rows
        invoice.invoiceItems.forEach((item: any) => {
          doc.text(item.serviceName, 50, y, { width: 190 });
          doc.text(item.quantity.toString(), 250, y, { width: 40, align: 'right' });
          doc.text(`INR ${Number(item.unitPrice).toFixed(2)}`, 300, y, { width: 70, align: 'right' });
          doc.text(`INR ${Number(item.discount).toFixed(2)}`, 380, y, { width: 70, align: 'right' });
          doc.text(`INR ${Number(item.total).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
          y += 20;
        });

        doc.moveTo(50, y).lineTo(540, y).stroke();
        y += 15;

        // Totals
        doc.text('Subtotal:', 380, y);
        doc.text(`INR ${Number(invoice.subtotal).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
        y += 15;

        doc.text('Discount:', 380, y);
        doc.text(`INR ${Number(invoice.discount).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
        y += 15;

        doc.text('Tax:', 380, y);
        doc.text(`INR ${Number(invoice.tax).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
        y += 15;

        doc.font('Helvetica-Bold');
        doc.text('Grand Total:', 380, y);
        doc.text(`INR ${Number(invoice.total).toFixed(2)}`, 470, y, { width: 70, align: 'right' });
        y += 20;
        doc.font('Helvetica');

        // Payment Summary
        const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const outstanding = Math.max(0, Number(invoice.total) - totalPaid);

        doc.text(`Amount Paid: INR ${totalPaid.toFixed(2)}`, 380, y);
        y += 15;
        doc.font('Helvetica-Bold');
        doc.text(`Amount Due: INR ${outstanding.toFixed(2)}`, 380, y);
        
        doc.moveDown(4);
        doc.font('Helvetica').fontSize(10).text('Thank you for your business!', { align: 'center' });

        doc.end();
      }
    });

    return new NextResponse(stream, { headers });
  } catch (error: any) {
    console.error(error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
