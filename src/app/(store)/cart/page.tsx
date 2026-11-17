import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShoppingBag, Truck } from "lucide-react";
import { getCart, summarizeCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { CartItemControls } from "@/components/store/cart-item-controls";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CartPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const summary = summarizeCart(cart, settings);
  const freeShippingProgress = Math.min(
    100,
    settings.freeShippingThreshold > 0 ? (summary.subtotal / settings.freeShippingThreshold) * 100 : 100,
  );

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Shopping cart</h1>
        </div>
        <Link href="/products" className="hidden text-sm font-semibold text-brand hover:underline sm:block">
          Continue shopping
        </Link>
      </div>

      {params.recovered && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Welcome back — your cart has been restored.
        </div>
      )}
      {params.error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Payment was not completed. Your cart is still here — you can try again.
        </div>
      )}

      {!cart || cart.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse the collection and add something you love. Your cart will be waiting here."
            actionHref="/products"
            actionLabel="Start shopping"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-sand pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted sm:grid">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
            </div>

            <ul className="divide-y divide-sand">
              {cart.items.map((item) => (
                <li key={item.id} className="grid grid-cols-[auto_1fr] gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="col-span-2 flex gap-4 sm:col-span-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-28 sm:w-24"
                    >
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt ?? item.product.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{item.product.brand ?? "M&R Homes"}</p>
                      <Link href={`/products/${item.product.slug}`} className="mt-0.5 block text-sm font-semibold leading-snug hover:text-brand">
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">{formatMoney(item.product.price, settings.currency)} each</p>
                      {item.quantity > item.product.stock && (
                        <p className="mt-1 text-xs font-medium text-rose-600">Only {item.product.stock} in stock — reduce quantity</p>
                      )}
                      <p className="mt-2 text-sm font-bold sm:hidden">{formatMoney(item.product.price * item.quantity, settings.currency)}</p>
                      <div className="mt-3 sm:hidden">
                        <CartItemControls itemId={item.id} quantity={item.quantity} stock={item.product.stock} />
                      </div>
                    </div>
                  </div>
                  <div className="hidden justify-center sm:flex">
                    <CartItemControls itemId={item.id} quantity={item.quantity} stock={item.product.stock} />
                  </div>
                  <div className="hidden text-right text-sm font-bold sm:block">
                    {formatMoney(item.product.price * item.quantity, settings.currency)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between">
              <Link href="/products" className="btn-outline btn-sm">Continue shopping</Link>
              <p className="text-xs text-muted">{summary.count} {summary.count === 1 ? "item" : "items"}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="card p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>

              <div className="mt-5 rounded-xl bg-brand-soft/70 p-3.5">
                <p className="flex items-center gap-2 text-xs font-medium text-brand-dark">
                  <Truck className="h-4 w-4" />
                  {summary.qualifiesForFreeShipping
                    ? "You qualify for free delivery."
                    : `Add ${formatMoney(summary.freeShippingRemaining, settings.currency)} for free delivery.`}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-medium">{formatMoney(summary.subtotal, settings.currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-medium">{summary.shipping === 0 ? "Free" : formatMoney(summary.shipping, settings.currency)}</dd></div>
                {summary.tax > 0 && (
                  <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-medium">{formatMoney(summary.tax, settings.currency)}</dd></div>
                )}
                <div className="flex justify-between border-t border-sand pt-3 text-base font-bold">
                  <dt>Total</dt><dd>{formatMoney(summary.total, settings.currency)}</dd>
                </div>
              </dl>

              <Link href="/checkout" className="btn-primary mt-5 h-12 w-full text-[15px]">
                Checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <Lock className="h-3 w-3" /> Secure payment powered by Paystack
              </p>
            </div>

            <div className="mt-4 space-y-2 px-2 text-xs text-muted">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> 14-day returns on unused items</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Delivery in 2–5 working days</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
