import { NextRequest, NextResponse } from "next/server";
import { sendAbandonedCartReminders } from "@/lib/abandoned";

export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendAbandonedCartReminders({ limit: 100 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron] abandoned cart reminders failed", error);
    return NextResponse.json({ ok: false, error: "Reminder run failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
