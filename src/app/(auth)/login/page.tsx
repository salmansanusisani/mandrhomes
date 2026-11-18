import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSession, safeNextPath } from "@/lib/auth";
import { LoginForm } from "@/components/store/auth-forms";
import { authErrorMessage } from "@/lib/auth-messages";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/account");
  const session = await getSession();
  if (session) redirect(next);

  const resetSuccess = params.reset === "1";
  const googleError = authErrorMessage(typeof params.error === "string" ? params.error : null);
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div>
      <h1 className="display text-3xl font-semibold sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to your account to continue.</p>

      {resetSuccess && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Password updated. You can now sign in with your new password.
        </div>
      )}
      {googleError && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {googleError}
        </div>
      )}

      <div className="mt-7">
        <LoginForm next={next} />
      </div>

      {isDev && process.env.ADMIN_EMAIL && (
        <div className="mt-8 rounded-xl border border-dashed border-sand-strong bg-white/60 p-4 text-[11px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">Development credentials</p>
          <p className="mt-1">Admin: {process.env.ADMIN_EMAIL} / {process.env.ADMIN_PASSWORD}</p>
          <p>Customer: amina@example.com / Customer123!</p>
        </div>
      )}
    </div>
  );
}
