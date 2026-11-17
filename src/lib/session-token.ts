import { jwtVerify } from "jose/jwt/verify";
import { SignJWT } from "jose/jwt/sign";

export const SESSION_COOKIE = "shopwave_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(value);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("shopwave")
    .setAudience("shopwave-web")
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "shopwave",
      audience: "shopwave-web",
    });
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    const role = payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
    return { sub: payload.sub, email: payload.email, name: payload.name, role };
  } catch {
    return null;
  }
}
