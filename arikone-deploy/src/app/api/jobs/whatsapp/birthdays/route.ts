import { NextResponse } from "next/server";
import { processBirthdayCampaigns } from "@/lib/whatsapp/birthday-campaign";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.JOB_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await processBirthdayCampaigns();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to process birthday campaigns", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
