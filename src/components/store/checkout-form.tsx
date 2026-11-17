"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { placeOrderAction } from "@/app/actions/checkout";
import type { CheckoutState } from "@/lib/types";

type Defaults = {
  customerName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

function Field({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="input" {...props} />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function SubmitButton({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary h-12 w-full text-[15px]" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      {pending ? "Starting secure checkout…" : `Pay ${amount} securely`}
    </button>
  );
}

export function CheckoutForm({
  defaults,
  amountLabel,
  isMock,
}: {
  defaults: Defaults;
  amountLabel: string;
  isMock: boolean;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrderAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-7">
      {state?.message && !state.ok && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold">Contact details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="customerName" defaultValue={defaults.customerName} error={errors.customerName} autoComplete="name" required />
          <Field label="Email address" name="email" type="email" defaultValue={defaults.email} error={errors.email} autoComplete="email" required />
          <Field label="Phone number" name="phone" type="tel" defaultValue={defaults.phone} error={errors.phone} autoComplete="tel" required />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Delivery address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Street address" name="line1" defaultValue={defaults.line1} error={errors.line1} autoComplete="address-line1" required />
          </div>
          <div className="sm:col-span-2">
            <Field label="Apartment, suite, etc. (optional)" name="line2" defaultValue={defaults.line2} error={errors.line2} autoComplete="address-line2" />
          </div>
          <Field label="City" name="city" defaultValue={defaults.city} error={errors.city} autoComplete="address-level2" required />
          <Field label="State" name="state" defaultValue={defaults.state} error={errors.state} autoComplete="address-level1" required />
          <Field label="Postal code (optional)" name="postalCode" defaultValue={defaults.postalCode} error={errors.postalCode} autoComplete="postal-code" />
          <Field label="Country" name="country" defaultValue={defaults.country} error={errors.country} autoComplete="country-name" required />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Order notes (optional)</h2>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults.notes}
          className="input mt-4 resize-y"
          placeholder="Delivery instructions, gift note, anything we should know?"
        />
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-brand" /> Payment
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          You will be redirected to Paystack to pay by card, bank transfer, USSD or mobile money. Your card details never
          touch our servers.
        </p>
        {isMock && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Development mode: Paystack keys are not configured, so a mock payment screen will appear instead.
          </p>
        )}
      </section>

      {state?.message && !state.ok && (
        <p className="text-xs text-rose-600">Please fix the highlighted fields and try again.</p>
      )}

      <SubmitButton amount={amountLabel} />
    </form>
  );
}
