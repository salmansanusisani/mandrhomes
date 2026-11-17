import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { RegisterForm } from "@/components/store/auth-forms";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/account");
  const session = await getSession();
  if (session) redirect(next);

  return (
    <div>
      <h1 className="display text-3xl font-semibold sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Save favourites, track orders and check out faster.</p>
      <div className="mt-7">
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
