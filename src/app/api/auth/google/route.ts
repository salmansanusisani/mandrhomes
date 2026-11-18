import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth";
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE,
  googleAuthorizationUrl,
  googleConfig,
} from "@/lib/google";

export async function GET(request: NextRequest) {
  const config = googleConfig(request.url);
  if (!config.configured) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));
  }

  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/account");
  const state = randomBytes(24).toString("hex");
  const authorizationUrl = googleAuthorizationUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state,
  });

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_STATE_MAX_AGE,
  };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_NEXT_COOKIE, next, cookieOptions);
  return response;
}
