"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  getClientIp,
  hashPassword,
  safeNextPath,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { adoptCartOnLogin } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema, fieldErrors, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const limit = rateLimit(`register:${ip}`, 5, 60_000);
  if (!limit.success) return { ok: false, message: "Too many attempts. Please try again in a minute." };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false, message: "An account with this email already exists.", errors: { email: "Email already registered" } };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: "CUSTOMER" });
  await adoptCartOnLogin({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: "CUSTOMER",
    createdAt: user.createdAt,
  });

  const { sendWelcomeEmail } = await import("@/lib/email");
  await sendWelcomeEmail(user).catch(() => undefined);

  revalidatePath("/", "layout");
  const next = safeNextPath(formData.get("next"), "/account");
  redirect(next);
}

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const emailValue = String(formData.get("email") ?? "").toLowerCase();
  const limit = rateLimit(`login:${ip}:${emailValue}`, 8, 5 * 60_000);
  if (!limit.success) return { ok: false, message: "Too many sign-in attempts. Try again in a few minutes." };

  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Enter your email and password.", errors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, message: "Incorrect email or password." };
  }

  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
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
  redirect(safeNextPath(formData.get("next"), fallback));
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const limit = rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!limit.success) return { ok: false, message: "Too many requests. Please try again later." };

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: "Enter a valid email address.", errors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const { sendPasswordResetEmail } = await import("@/lib/email");
    await sendPasswordResetEmail(user, absoluteUrl(`/reset-password?token=${token}`)).catch(() => undefined);
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resetPasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const limit = rateLimit(`reset:${ip}`, 8, 15 * 60_000);
  if (!limit.success) return { ok: false, message: "Too many attempts. Please try again later." };

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This reset link is invalid or has expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id }, usedAt: null } }),
  ]);

  redirect("/login?reset=1");
}
