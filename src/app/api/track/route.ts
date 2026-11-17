import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VISITOR_COOKIE = "shopwave_visitor";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const BOT_PATTERN = /bot|crawler|spider|preview|lighthouse|headless|pingdom|uptime/i;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: unknown; referrer?: unknown };
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "";
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    if (BOT_PATTERN.test(userAgent)) return NextResponse.json({ ok: true, skipped: true });

    const rawReferrer = typeof body.referrer === "string" ? body.referrer : "";
    const referrer = rawReferrer ? rawReferrer.slice(0, 500) : null;

    const store = await cookies();
    let sessionId = store.get(VISITOR_COOKIE)?.value;
    if (!sessionId) {
      sessionId = randomUUID();
      store.set(VISITOR_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_MAX_AGE,
      });
    }

    const session = await getSession();
    await prisma.pageView.create({
      data: {
        path,
        referrer,
        sessionId,
        userId: session?.id ?? null,
        userAgent: userAgent.slice(0, 500) || null,
        country: request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("[analytics] track failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
