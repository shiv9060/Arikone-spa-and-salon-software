"use server";

import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

export async function updateWhatsAppSettings(data: any) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "WHATSAPP_SETTINGS")) {
    throw new Error("Unauthorized");
  }

  await prisma.tenantSettings.update({
    where: { tenantId: session.tenantId },
    data: {
      whatsappSettings: data,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      userId: session.userId,
      action: "WHATSAPP_SETTINGS_UPDATED",
      entityType: "TenantSettings",
      description: "Updated WhatsApp settings",
    },
  });

  revalidatePath("/dashboard/whatsapp/settings");
}
