import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { paymentsAreMock } from "@/lib/paystack";
import { CheckoutExperience } from "@/components/store/checkout-experience";

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

      <CheckoutExperience
        defaults={defaults}
        items={cart.items.map((item) => ({
          id: item.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0]?.url ?? null,
        }))}
        count={summary.count}
        subtotal={summary.subtotal}
        tax={summary.tax}
        currency={settings.currency}
        isMock={paymentsAreMock()}
        shippingFlat={settings.shippingFlat}
        abujaShippingFee={settings.abujaShippingFee}
        freeShippingThreshold={settings.freeShippingThreshold}
      />
    </div>
  );
}
