"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

function SubmitButton({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={cn("btn-primary shrink-0", compact && "px-4")} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      <span className={compact ? "sr-only" : ""}>{compact ? "Subscribe" : "Subscribe"}</span>
    </button>
  );
}

export function NewsletterForm({ compact = false, source = "footer" }: { compact?: boolean; source?: string }) {
  const [state, action] = useActionState(subscribeToNewsletter, null);

  if (state?.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <Check className="h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      <div className="flex items-center gap-2">
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-${source}`}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={cn("input", compact ? "py-2" : "")}
          autoComplete="email"
        />
        <SubmitButton compact={compact} />
      </div>
      {state?.message && !state.ok && <p className="mt-2 text-xs text-rose-600">{state.message}</p>}
      {state?.errors?.email && <p className="mt-2 text-xs text-rose-600">{state.errors.email}</p>}
    </form>
  );
}
