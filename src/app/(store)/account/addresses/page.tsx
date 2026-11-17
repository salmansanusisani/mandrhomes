import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { AddressForm } from "@/components/store/account-forms";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <span className="text-xs text-muted">{addresses.length} {addresses.length === 1 ? "address" : "addresses"}</span>
      </div>

      {addresses.length === 0 && (
        <EmptyState icon={MapPin} title="No addresses yet" description="Add a delivery address below to check out faster next time." className="py-10" />
      )}

      {addresses.map((address) => (
        <div key={address.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{address.fullName}</p>
                {address.isDefault && <span className="badge bg-brand-soft text-brand"><Star className="h-3 w-3" /> Default</span>}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
                {[address.city, address.state].filter(Boolean).join(", ")} · {address.country}<br />
                {address.phone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!address.isDefault && (
                <form action={setDefaultAddressAction}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className="btn-ghost btn-sm text-xs">Set default</button>
                </form>
              )}
              <form action={deleteAddressAction}>
                <input type="hidden" name="id" value={address.id} />
                <button type="submit" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Delete address">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <details className="group mt-4">
            <summary className="cursor-pointer text-xs font-semibold text-brand">Edit address</summary>
            <div className="mt-4 border-t border-sand pt-4">
              <AddressForm
                address={{
                  id: address.id,
                  fullName: address.fullName,
                  phone: address.phone,
                  line1: address.line1,
                  line2: address.line2 ?? "",
                  city: address.city,
                  state: address.state,
                  postalCode: address.postalCode ?? "",
                  country: address.country,
                  isDefault: address.isDefault,
                }}
              />
            </div>
          </details>
        </div>
      ))}

      <details className="card group p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-brand">
          <Plus className="h-4 w-4" /> Add a new address
        </summary>
        <div className="mt-5 border-t border-sand pt-5">
          <AddressForm />
        </div>
      </details>
    </div>
  );
}
