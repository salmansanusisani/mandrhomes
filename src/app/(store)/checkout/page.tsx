import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, ShieldCheck, Truck } from "lucide-react";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { paymentsAreMock } from "@/lib/paystack";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [cart, settings, session] = await Promise.all([getCart(), getSettings(), getSession()]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const summary = summarizeCart(cart, settings);
  const address = session
    ? await prisma.address.findFirst({ where: { userId: session.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
    : null;

  const defaults = {
    customerName: address?.fullName ?? session?.name ?? "",
    email: session?.email ?? "",
    phone: address?.phone ?? session?.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "Nigeria",
    notes: "",
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-xs text-muted">
          <Link href="/cart" className="hover:text-ink">Cart</Link>
          <span>/</span>
          <span className="text-ink">Checkout</span>
        </nav>
        <h1 className="display text-4xl font-semibold sm:text-5xl">Checkout</h1>
      </div>

      {params.cancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout was cancelled. Your cart is still saved.
        </div>
      )}
      {params.error === "payment" && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          We could not confirm your payment. If you were charged, contact support with your order reference.
        </div>
      )}

      {!session && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand bg-white px-4 py-3 text-sm">
          <p className="text-muted">Checking out as a guest. Sign in for faster checkout and order tracking.</p>
          <Link href="/login?next=%2Fcheckout" className="text-sm font-semibold text-brand hover:underline">Sign in</Link>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <CheckoutForm defaults={defaults} amountLabel={formatMoney(summary.total, settings.currency)} isMock={paymentsAreMock()} />
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-sand px-5 py-4">
              <h2 className="text-lg font-semibold">Your order</h2>
              <p className="mt-0.5 text-xs text-muted">{summary.count} {summary.count === 1 ? "item" : "items"}</p>
            </div>

            <ul className="max-h-80 divide-y divide-sand overflow-y-auto px-5">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill sizes="56px" className="object-cover" />
                    )}
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug">{item.product.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{formatMoney(item.product.price, settings.currency)} each</p>
                  </div>
                  <p className="text-xs font-semibold">{formatMoney(item.product.price * item.quantity, settings.currency)}</p>
                </li>
              ))}
            </ul>

            <div className="border-t border-sand px-5 py-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(summary.subtotal, settings.currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{summary.shipping === 0 ? "Free" : formatMoney(summary.shipping, settings.currency)}</dd></div>
                {summary.tax > 0 && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(summary.tax, settings.currency)}</dd></div>}
                <div className="flex justify-between border-t border-sand pt-2.5 text-base font-bold">
                  <dt>Total</dt><dd>{formatMoney(summary.total, settings.currency)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-xl bg-brand-soft/60 p-4 text-xs text-brand-dark">
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secured by Paystack. PCI-DSS compliant.</p>
            <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> Dispatched within 1 business day.</p>
            <p className="flex items-center gap-2"><Lock className="h-4 w-4" /> Your personal data is encrypted in transit.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
