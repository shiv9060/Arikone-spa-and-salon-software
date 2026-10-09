import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/auth/permissions';
import { getInvoiceById } from '@/services/billing.service';
import prisma from '@/lib/db/prisma';
import { ArrowLeft, Printer, FileText, XCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentDialog } from '@/components/billing/payment-dialog';
import { InvoiceActions } from '@/components/billing/invoice-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SendInvoiceWhatsAppBtn } from '@/components/whatsapp/send-invoice-whatsapp-btn';

export default async function InvoiceDetailPage(props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect('/login');

  if (!hasPermission(session.role, 'BILLING_VIEW')) {
    redirect('/dashboard/billing');
  }

  const invoice = await getInvoiceById(session.tenantId, params.invoiceId);

  const canUpdate = hasPermission(session.role, 'BILLING_UPDATE');
  const canCancel = hasPermission(session.role, 'BILLING_CANCEL');
  const canPay = hasPermission(session.role, 'PAYMENTS_CREATE');
  const canSendWhatsApp = hasPermission(session.role, 'WHATSAPP_SEND');

  // Fast fetch to see if whatsapp is enabled
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { settings: true }
  });
  const whatsappSettings = tenant?.settings?.whatsappSettings as any;
  const isWhatsAppEnabled = whatsappSettings?.enabled;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
              <Badge className={
                invoice.status === 'FINALIZED' ? 'bg-blue-100 text-blue-800' :
                invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }>
                {invoice.status}
              </Badge>
              <Badge className={
                invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                invoice.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 
                invoice.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }>
                Payment: {invoice.paymentStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground">Issued on {new Date(invoice.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {invoice.status !== 'CANCELLED' && (
            <Link href={`/api/billing/${invoice.id}/pdf`} target="_blank">
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print PDF
              </Button>
            </Link>
          )}

          {invoice.status === 'DRAFT' && canUpdate && (
            <InvoiceActions invoiceId={invoice.id} actionType="finalize" />
          )}

          {invoice.status !== 'CANCELLED' && canCancel && (
            <InvoiceActions invoiceId={invoice.id} actionType="cancel" />
          )}

          {invoice.status === 'FINALIZED' && invoice.paymentStatus !== 'PAID' && canPay && (
            <PaymentDialog invoice={invoice} />
          )}

          {invoice.status === 'FINALIZED' && isWhatsAppEnabled && canSendWhatsApp && invoice.customer.mobile && !invoice.customer.whatsappOptOut && (
            <SendInvoiceWhatsAppBtn invoiceId={invoice.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.invoiceItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.serviceName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{Number(item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {Number(item.discount) > 0 ? `-₹${Number(item.discount).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>₹{Number(item.taxAmount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{Number(item.taxPercent)}%</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{Number(item.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Global Discount</span>
                <span className="text-green-600">-₹{Number(invoice.discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tax</span>
                <span>₹{Number(invoice.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-medium text-lg">{invoice.customer.name}</div>
                <div className="text-muted-foreground">{invoice.customer.mobile}</div>
                {invoice.customer.email && <div className="text-muted-foreground">{invoice.customer.email}</div>}
                <div className="pt-4">
                  <Link href={`/dashboard/customers/${invoice.customer.id}`}>
                    <Button variant="link" className="px-0">View Profile</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="space-y-4">
                  {invoice.payments.map((p, idx) => (
                    <div key={p.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium">₹{Number(p.amount).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{p.paymentMode}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.paidAt).toLocaleString()}</div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                  
                  {(() => {
                    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    const outstanding = Math.max(0, Number(invoice.total) - totalPaid);
                    
                    return (
                      <div className="pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid</span>
                          <span className="font-medium text-green-600">₹{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance Due</span>
                          <span className="font-medium text-orange-600">₹{outstanding.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
