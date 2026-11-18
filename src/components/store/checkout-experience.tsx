"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowRight, Lock, Loader2, ShieldCheck, Truck } from "lucide-react";
import { placeOrderAction } from "@/app/actions/checkout";
import { NIGERIAN_STATES, shippingForState } from "@/lib/shipping";
import { formatMoney } from "@/lib/utils";
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

type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

type Props = {
  defaults: Defaults;
  items: CartLine[];
  count: number;
  subtotal: number;
  tax: number;
  currency: string;
  isMock: boolean;
  shippingFlat: number;
  abujaShippingFee: number;
  freeShippingThreshold: number;
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

export function CheckoutExperience({
  defaults,
  items,
  count,
  subtotal,
  tax,
  currency,
  isMock,
  shippingFlat,
  abujaShippingFee,
  freeShippingThreshold,
}: Props) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrderAction, null);
  const errors = state?.errors ?? {};
  const [deliveryState, setDeliveryState] = useState(defaults.state);
  const shipping = shippingForState(deliveryState, subtotal, {
    shippingFlat,
    abujaShippingFee,
    freeShippingThreshold,
  });
  const total = subtotal + shipping + tax;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const qualifiesForFreeShipping =
    subtotal > 0 && freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const stateOptions = NIGERIAN_STATES.includes(deliveryState as (typeof NIGERIAN_STATES)[number])
    ? NIGERIAN_STATES
    : deliveryState
      ? [deliveryState, ...NIGERIAN_STATES]
      : NIGERIAN_STATES;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
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
            <div>
              <label htmlFor="state" className="label">State</label>
              <select
                id="state"
                name="state"
                value={deliveryState}
                onChange={(event) => setDeliveryState(event.target.value)}
                className="input"
                autoComplete="address-level1"
                required
              >
                <option value="" disabled>Select your state</option>
                {stateOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-xs text-rose-600">{errors.state}</p>}
              <p className="mt-1 text-[11px] text-muted">
                Delivery is {formatMoney(abujaShippingFee, currency)} in Abuja and {formatMoney(shippingFlat, currency)} elsewhere in Nigeria.
              </p>
            </div>
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

        <SubmitButton amount={formatMoney(total, currency)} />
      </form>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-sand px-5 py-4">
            <h2 className="text-lg font-semibold">Your order</h2>
            <p className="mt-0.5 text-xs text-muted">{count} {count === 1 ? "item" : "items"}</p>
          </div>

          <ul className="max-h-80 divide-y divide-sand overflow-y-auto px-5">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  )}
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-snug">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{formatMoney(item.price, currency)} each</p>
                </div>
                <p className="text-xs font-semibold">{formatMoney(item.price * item.quantity, currency)}</p>
              </li>
            ))}
          </ul>

          <div className="border-t border-sand px-5 py-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery{deliveryState ? ` to ${deliveryState}` : ""}</dt>
                <dd>{qualifiesForFreeShipping ? "Free" : formatMoney(shipping, currency)}</dd>
              </div>
              {tax > 0 && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(tax, currency)}</dd></div>}
              <div className="flex justify-between border-t border-sand pt-2.5 text-base font-bold">
                <dt>Total</dt><dd>{formatMoney(total, currency)}</dd>
              </div>
            </dl>
            {!qualifiesForFreeShipping && freeShippingThreshold > 0 && (
              <p className="mt-3 text-[11px] text-muted">
                Add {formatMoney(remainingForFreeShipping, currency)} more for free delivery.
              </p>
            )}
            <Link href="/cart" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
              Edit cart <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-brand-soft/60 p-4 text-xs text-brand-dark">
          <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secured by Paystack. PCI-DSS compliant.</p>
          <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> Dispatched within 1 business day.</p>
          <p className="flex items-center gap-2"><Lock className="h-4 w-4" /> Your personal data is encrypted in transit.</p>
        </div>
      </aside>
    </div>
  );
}
