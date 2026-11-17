"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary h-11 w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

function PasswordInput({
  name,
  placeholder,
  autoComplete,
  error,
  id,
}: {
  name: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  id: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">Password</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input pr-11"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand/70"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  if (state.ok) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}

export function LoginForm({ next = "/account" }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Feedback state={state} />
      <div>
        <label htmlFor="login-email" className="label">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
          required
        />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
      </div>
      <PasswordInput id="login-password" name="password" placeholder="Your password" autoComplete="current-password" error={errors.password} />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Secure sign-in</span>
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">Forgot password?</Link>
      </div>
      <SubmitButton label="Sign in" pendingLabel="Signing in…" />
      <p className="text-center text-xs text-muted">
        New here? <Link href="/register" className="font-semibold text-brand hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next = "/account" }: { next?: string }) {
  const [state, action] = useActionState(registerAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Feedback state={state} />
      <div>
        <label htmlFor="register-name" className="label">Full name</label>
        <input id="register-name" name="name" autoComplete="name" className="input" placeholder="Ada Obi" required minLength={2} />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="register-email" className="label">Email address</label>
        <input id="register-email" name="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" required />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
      </div>
      <PasswordInput id="register-password" name="password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password} />
      <p className="text-[11px] leading-relaxed text-muted">
        By creating an account you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
        <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
      <SubmitButton label="Create account" pendingLabel="Creating account…" />
      <p className="text-center text-xs text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Feedback state={state} />
        <p className="text-sm text-muted">Didn&apos;t get the email? Check spam or try again in a minute.</p>
        <Link href="/login" className="btn-outline h-11 w-full">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="forgot-email" className="label">Email address</label>
        <input id="forgot-email" name="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" required />
        {state?.errors?.email && <p className="mt-1 text-xs text-rose-600">{state.errors.email}</p>}
      </div>
      <SubmitButton label="Send reset link" pendingLabel="Sending…" />
      <p className="text-center text-xs text-muted">
        Remembered it? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <PasswordInput id="reset-password" name="password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password} />
      <div>
        <label htmlFor="reset-confirm" className="label">Confirm new password</label>
        <input
          id="reset-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="input"
          placeholder="Repeat your new password"
          required
          minLength={8}
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
      </div>
      <SubmitButton label="Update password" pendingLabel="Updating…" />
      <p className="text-center text-xs text-muted">
        <Link href="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
