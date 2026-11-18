import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { RegisterForm } from "@/components/store/auth-forms";
import { authErrorMessage } from "@/lib/auth-messages";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/account");
  const session = await getSession();
  if (session) redirect(next);
  const googleError = authErrorMessage(typeof params.error === "string" ? params.error : null);
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());

  return (
    <div>
      <h1 className="display text-3xl font-semibold sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Save favourites, track orders and check out faster.</p>
      {googleError && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {googleError}
        </div>
      )}
      <div className="mt-7">
        <RegisterForm next={next} googleEnabled={googleEnabled} />
      </div>
    </div>
  );
}
