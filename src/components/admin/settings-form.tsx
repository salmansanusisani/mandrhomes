"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updateSettingsAction } from "@/app/actions/admin";
import type { StoreSettings } from "@/lib/settings";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="input" {...props} />
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action] = useActionState(updateSettingsAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      {state?.message && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      )}

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Store details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Store name" name="storeName" defaultValue={settings.storeName} error={errors.storeName} required />
          <Field label="Currency" name="currency" defaultValue={settings.currency} error={errors.currency} hint="NGN, USD, GHS, ZAR or KES." />
          <div className="sm:col-span-2">
            <Field label="Tagline" name="tagline" defaultValue={settings.tagline} error={errors.tagline} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Abuja showroom address" name="address" defaultValue={settings.address} error={errors.address} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Kano showroom address" name="address2" defaultValue={settings.address2} error={errors.address2} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Pricing, delivery &amp; tax</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Abuja delivery fee (₦)" name="abujaShippingFee" type="number" step="0.01" min="0" defaultValue={String(settings.abujaShippingFee / 100)} error={errors.abujaShippingFee} hint="Applies to FCT / Abuja addresses." />
          <Field label="Other Nigeria fee (₦)" name="shippingFlat" type="number" step="0.01" min="0" defaultValue={String(settings.shippingFlat / 100)} error={errors.shippingFlat} hint="Applies outside Abuja." />
          <Field label="Free delivery over (₦)" name="freeShippingThreshold" type="number" step="0.01" min="0" defaultValue={String(settings.freeShippingThreshold / 100)} error={errors.freeShippingThreshold} hint="Set 0 to always charge delivery." />
          <Field label="Tax rate (%)" name="taxRate" type="number" step="0.01" min="0" max="100" defaultValue={String(settings.taxRate * 100)} error={errors.taxRate} hint="Added to the subtotal at checkout." />
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Support</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Support email" name="supportEmail" type="email" defaultValue={settings.supportEmail} error={errors.supportEmail} />
          <Field label="Support phone" name="supportPhone" defaultValue={settings.supportPhone} error={errors.supportPhone} />
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Operations</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Low stock threshold" name="lowStockThreshold" type="number" min="0" defaultValue={String(settings.lowStockThreshold)} error={errors.lowStockThreshold} />
          <Field label="Abandoned cart wait (hours)" name="abandonedCartHours" type="number" min="1" defaultValue={String(settings.abandonedCartHours)} error={errors.abandonedCartHours} />
          <Field label="Max reminders per cart" name="abandonedCartMaxReminders" type="number" min="1" max="10" defaultValue={String(settings.abandonedCartMaxReminders)} error={errors.abandonedCartMaxReminders} />
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Social links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Instagram URL" name="instagram" defaultValue={settings.instagram} error={errors.instagram} placeholder="https://instagram.com/…" />
          <Field label="TikTok URL" name="tiktok" defaultValue={settings.tiktok} error={errors.tiktok} placeholder="https://tiktok.com/@…" />
          <Field label="Facebook URL" name="facebook" defaultValue={settings.facebook} error={errors.facebook} placeholder="https://facebook.com/…" />
          <Field label="X URL" name="x" defaultValue={settings.x} error={errors.x} placeholder="https://x.com/…" />
        </div>
      </section>

      <Submit />
    </form>
  );
}
