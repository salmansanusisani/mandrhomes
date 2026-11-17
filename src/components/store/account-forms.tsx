"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { changePasswordAction, saveAddressAction, updateProfileAction } from "@/app/actions/account";
import type { ActionState } from "@/lib/types";

function Feedback({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
        state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{state.message}</span>
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="profile-name" className="label">Full name</label>
        <input id="profile-name" name="name" defaultValue={name} className="input" required minLength={2} />
        {state?.errors?.name && <p className="mt-1 text-xs text-rose-600">{state.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="profile-phone" className="label">Phone number</label>
        <input id="profile-phone" name="phone" defaultValue={phone} className="input" placeholder="+234 800 000 0000" />
        {state?.errors?.phone && <p className="mt-1 text-xs text-rose-600">{state.errors.phone}</p>}
      </div>
      <Submit label="Save changes" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="current-password" className="label">Current password</label>
        <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" className="input" required />
        {state?.errors?.currentPassword && <p className="mt-1 text-xs text-rose-600">{state.errors.currentPassword}</p>}
      </div>
      <div>
        <label htmlFor="new-password" className="label">New password</label>
        <input id="new-password" name="newPassword" type="password" autoComplete="new-password" className="input" required minLength={8} />
        {state?.errors?.newPassword && <p className="mt-1 text-xs text-rose-600">{state.errors.newPassword}</p>}
      </div>
      <div>
        <label htmlFor="confirm-password" className="label">Confirm new password</label>
        <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" className="input" required minLength={8} />
        {state?.errors?.confirmPassword && <p className="mt-1 text-xs text-rose-600">{state.errors.confirmPassword}</p>}
      </div>
      <Submit label="Update password" />
    </form>
  );
}

export type AddressDefaults = {
  id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export function AddressForm({ address }: { address?: AddressDefaults }) {
  const [state, action] = useActionState(saveAddressAction, null);
  return (
    <form action={action} className="space-y-4">
      {address?.id && <input type="hidden" name="id" value={address.id} />}
      <Feedback state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`addr-name-${address?.id ?? "new"}`}>Full name</label>
          <input id={`addr-name-${address?.id ?? "new"}`} name="fullName" defaultValue={address?.fullName} className="input" required />
          {state?.errors?.fullName && <p className="mt-1 text-xs text-rose-600">{state.errors.fullName}</p>}
        </div>
        <div>
          <label className="label" htmlFor={`addr-phone-${address?.id ?? "new"}`}>Phone</label>
          <input id={`addr-phone-${address?.id ?? "new"}`} name="phone" defaultValue={address?.phone} className="input" required />
          {state?.errors?.phone && <p className="mt-1 text-xs text-rose-600">{state.errors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`addr-line1-${address?.id ?? "new"}`}>Street address</label>
          <input id={`addr-line1-${address?.id ?? "new"}`} name="line1" defaultValue={address?.line1} className="input" required />
          {state?.errors?.line1 && <p className="mt-1 text-xs text-rose-600">{state.errors.line1}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`addr-line2-${address?.id ?? "new"}`}>Apartment, suite, etc. (optional)</label>
          <input id={`addr-line2-${address?.id ?? "new"}`} name="line2" defaultValue={address?.line2} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`addr-city-${address?.id ?? "new"}`}>City</label>
          <input id={`addr-city-${address?.id ?? "new"}`} name="city" defaultValue={address?.city} className="input" required />
          {state?.errors?.city && <p className="mt-1 text-xs text-rose-600">{state.errors.city}</p>}
        </div>
        <div>
          <label className="label" htmlFor={`addr-state-${address?.id ?? "new"}`}>State</label>
          <input id={`addr-state-${address?.id ?? "new"}`} name="state" defaultValue={address?.state} className="input" required />
          {state?.errors?.state && <p className="mt-1 text-xs text-rose-600">{state.errors.state}</p>}
        </div>
        <div>
          <label className="label" htmlFor={`addr-postal-${address?.id ?? "new"}`}>Postal code (optional)</label>
          <input id={`addr-postal-${address?.id ?? "new"}`} name="postalCode" defaultValue={address?.postalCode} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`addr-country-${address?.id ?? "new"}`}>Country</label>
          <input id={`addr-country-${address?.id ?? "new"}`} name="country" defaultValue={address?.country ?? "Nigeria"} className="input" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 accent-brand" />
        Use as my default delivery address
      </label>
      <Submit label={address?.id ? "Save address" : "Add address"} />
    </form>
  );
}
