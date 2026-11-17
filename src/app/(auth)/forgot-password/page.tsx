import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/store/auth-forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="display text-3xl font-semibold sm:text-4xl">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Enter the email address linked to your account and we&apos;ll send you a secure link to reset it.
      </p>
      <div className="mt-7">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
