import prisma from "@/lib/db/prisma";
import { WhatsAppMessageType } from "@prisma/client";
import { DEFAULT_TEMPLATES, compileTemplate } from "./templates";
import { getWhatsAppProvider } from "./factory";

export async function sendInvoiceOnWhatsApp(tenantId: string, invoiceId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant) throw new Error("Tenant not found");

  const settings = tenant.settings?.whatsappSettings as any;
  if (!settings?.enabled) {
    throw new Error("WhatsApp is not enabled for this tenant");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { customer: true, payments: true },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (!invoice.customer.mobile) throw new Error("Customer does not have a valid mobile number");
  if (invoice.customer.whatsappOptOut) throw new Error("Customer has opted out of WhatsApp messages");

  const customTemplate = await prisma.messageTemplate.findFirst({
    where: { tenantId, type: WhatsAppMessageType.INVOICE, isActive: true },
  });

  const templateContent = customTemplate?.content || DEFAULT_TEMPLATES.INVOICE;

  const amountPaid = invoice.payments ? invoice.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0) : 0;
  const amountDue = Number(invoice.total) - amountPaid;

  const content = compileTemplate(templateContent, {
    customer_name: invoice.customer.name,
    business_name: tenant.name,
    invoice_number: invoice.invoiceNumber,
    invoice_total: String(invoice.total),
    amount_paid: String(amountPaid),
    amount_due: String(amountDue),
    business_phone: tenant.phone || "",
  });

  // Mock document upload / sending. In real provider, we'd generate the PDF and attach it.
  const provider = getWhatsAppProvider();
  
  const result = await provider.sendMessage({
    to: invoice.customer.mobile,
    content,
    messageType: WhatsAppMessageType.INVOICE,
    // future: documentUrl: "..."
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to send invoice via WhatsApp");
  }

  await prisma.whatsAppLog.create({
    data: {
      tenantId,
      customerId: invoice.customer.id,
      messageType: WhatsAppMessageType.INVOICE,
      recipientMobile: invoice.customer.mobile,
      providerMessageId: result.providerMessageId,
      status: "SENT",
      sentAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      action: "INVOICE_WHATSAPP_SENT",
      entityType: "Invoice",
      entityId: invoice.id,
      description: `Sent invoice ${invoice.invoiceNumber} via WhatsApp to ${invoice.customer.name}`,
    },
  });

  return { success: true };
}
