import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adoptCartOnLogin } from "@/lib/cart";
import { hashPassword, safeNextPath } from "@/lib/auth";
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  googleConfig,
} from "@/lib/google";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSessionToken } from "@/lib/session-token";

type GoogleProfile = {
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  response.cookies.delete(GOOGLE_NEXT_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const store = await cookies();
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value;
  const next = safeNextPath(store.get(GOOGLE_NEXT_COOKIE)?.value, "/account");

  if (oauthError) {
    return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_cancelled", request.url)));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_failed", request.url)));
  }

  const config = googleConfig(request.url);
  if (!config.configured) {
    return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_unavailable", request.url)));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      console.error("[google] token exchange failed", await tokenResponse.text());
      return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_failed", request.url)));
    }

    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_failed", request.url)));
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_failed", request.url)));
    }

    const profile = (await profileResponse.json()) as GoogleProfile;
    const emailVerified = profile.email_verified === true || profile.email_verified === "true";
    if (typeof profile.email !== "string" || !emailVerified) {
      return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_email", request.url)));
    }

    const email = profile.email.trim().toLowerCase();
    const name =
      typeof profile.name === "string" && profile.name.trim()
        ? profile.name.trim()
        : email.split("@")[0];

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: await hashPassword(randomBytes(32).toString("hex")),
        },
      });
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail(user).catch(() => undefined);
    }

    await adoptCartOnLogin({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    });

    revalidatePath("/", "layout");
    const fallback = user.role === "ADMIN" ? "/admin" : "/account";
    const destination = next === "/account" ? fallback : next;
    const response = clearOAuthCookies(NextResponse.redirect(new URL(destination, request.url)));
    const sessionToken = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("[google] callback failed", error);
    return clearOAuthCookies(NextResponse.redirect(new URL("/login?error=google_failed", request.url)));
  }
}
