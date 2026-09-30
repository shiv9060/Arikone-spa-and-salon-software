import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { sendInvoiceOnWhatsApp } from "@/lib/whatsapp/invoices";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "WHATSAPP_SEND")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await sendInvoiceOnWhatsApp(session.tenantId, params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to send invoice via WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invoice" },
      { status: 500 }
    );
  }
}
