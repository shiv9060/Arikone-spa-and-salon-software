import prisma from "@/lib/db/prisma";
import { WhatsAppMessageType } from "@prisma/client";
import { DEFAULT_TEMPLATES, compileTemplate } from "./templates";

export async function processBirthdayCampaigns() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    include: { settings: true },
  });

  for (const tenant of tenants) {
    const settings = tenant.settings?.whatsappSettings as any;
    if (!settings?.enabled || !settings?.birthdayMessagesEnabled) {
      continue;
    }

    // Get today's month and day in tenant's timezone
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: tenant.timezone }));
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();

    // Prisma doesn't have a built in way to extract day/month for postgres natively easily in ORM, 
    // so we fetch customers with a DOB and filter them. 
    // Alternatively, use raw query:
    const customers = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Customer" 
      WHERE "tenantId" = ${tenant.id} 
      AND "isActive" = true 
      AND "whatsappOptOut" = false 
      AND "mobile" IS NOT NULL
      AND EXTRACT(MONTH FROM "dateOfBirth") = ${month}
      AND EXTRACT(DAY FROM "dateOfBirth") = ${day}
    `;

    // Fetch custom template if exists
    const customTemplate = await prisma.messageTemplate.findFirst({
      where: { tenantId: tenant.id, type: WhatsAppMessageType.BIRTHDAY_GREETING, isActive: true },
    });
    
    let templateContent = customTemplate?.content || DEFAULT_TEMPLATES.BIRTHDAY_GREETING;

    // Fetch the attached offer if configured
    let offerDetails = null;
    if (settings.birthdayOfferId) {
      const offer = await prisma.offer.findUnique({
        where: { id: settings.birthdayOfferId }
      });
      if (offer && offer.isActive) {
        offerDetails = offer;
        // Append a default offer message if the template doesn't explicitly use the variables
        if (!templateContent.includes("{{offer_discount}}")) {
          templateContent += "\n\nAs a special gift, we are offering you {{offer_discount}} off on your next visit! Use coupon code: {{coupon_code}}";
        }
      }
    }

    for (const customer of customers) {
      const idempotencyKey = `${tenant.id}_${customer.id}_BIRTHDAY_${year}`;
      
      const existingJob = await prisma.messageJob.findUnique({
        where: { tenantId_idempotencyKey: { tenantId: tenant.id, idempotencyKey } },
      });

      if (existingJob) {
        continue;
      }

      const dataVars: any = {
        customer_name: customer.name,
        business_name: tenant.name,
        business_phone: tenant.phone || "",
      };

      if (offerDetails) {
        dataVars.offer_name = offerDetails.name;
        dataVars.offer_discount = offerDetails.discountPercent 
          ? `${Number(offerDetails.discountPercent)}%` 
          : `₹${Number(offerDetails.discountAmount)}`;
        dataVars.coupon_code = offerDetails.couponCode || "No code needed";
      }

      const content = compileTemplate(templateContent, dataVars);

      await prisma.messageJob.create({
        data: {
          tenantId: tenant.id,
          type: WhatsAppMessageType.BIRTHDAY_GREETING,
          recipient: customer.mobile,
          payload: {
            customerId: customer.id,
            content,
          },
          scheduledAt: new Date(),
          idempotencyKey,
        },
      });
      
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "BIRTHDAY_MESSAGE_QUEUED",
          entityType: "Customer",
          entityId: customer.id,
          description: `Queued birthday message for ${customer.name}`,
        }
      });
    }
  }
}
