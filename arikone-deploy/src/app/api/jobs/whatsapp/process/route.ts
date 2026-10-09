import { NextResponse } from "next/server";
import { processPendingMessageJobs } from "@/lib/whatsapp/jobs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.JOB_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await processPendingMessageJobs();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to process message jobs", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
