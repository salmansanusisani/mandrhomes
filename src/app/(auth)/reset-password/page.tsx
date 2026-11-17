import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/store/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    return (
      <div>
        <h1 className="display text-3xl font-semibold">Reset link missing</h1>
        <p className="mt-2 text-sm text-muted">This page needs a valid reset token. Request a new link to continue.</p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full">Request a new link</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display text-3xl font-semibold sm:text-4xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">Use at least 8 characters. Don&apos;t reuse an old password.</p>
      <div className="mt-7">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
