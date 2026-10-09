import { NextResponse } from "next/server";
import { processAppointmentReminders } from "@/lib/whatsapp/reminders";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.JOB_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await processAppointmentReminders();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to process appointment reminders", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
