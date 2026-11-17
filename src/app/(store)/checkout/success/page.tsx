import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const number = typeof params.order === "string" ? params.order : "";
  if (!number) notFound();

  const [order, session] = await Promise.all([
    prisma.order.findUnique({
      where: { number },
      include: { items: true, events: { orderBy: { createdAt: "asc" } } },
    }),
    getSession(),
  ]);
  if (!order) notFound();

  const paid = order.paymentStatus === "SUCCESS";
  const address = order.shippingAddress as Record<string, string | undefined>;
  const canViewOrder = session && (session.id === order.userId || session.role === "ADMIN");

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {paid ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
          </span>
          <h1 className="display mt-5 text-4xl font-semibold sm:text-5xl">
            {paid ? `Thank you, ${order.customerName.split(" ")[0]}.` : "Order received"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {paid
              ? `Your order ${order.number} is confirmed. A receipt has been sent to ${order.email}.`
              : `We have received order ${order.number}, but payment is still pending. Contact support if you need help.`}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} kind="payment" />
            <span>·</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="mt-10 card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-6 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Order</p>
              <p className="text-sm font-semibold">{order.number}</p>
            </div>
            <Link href="/products" className="btn-outline btn-sm">Continue shopping</Link>
          </div>

          <ul className="divide-y divide-sand px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{formatMoney(item.price, order.currency)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(item.price * item.quantity, order.currency)}</p>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-sand px-6 py-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</dd></div>
            {order.tax > 0 && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(order.tax, order.currency)}</dd></div>}
            <div className="flex justify-between border-t border-sand pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
          </dl>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4 text-brand" /> Delivery address</h2>
            <div className="mt-3 space-y-0.5 text-xs leading-relaxed text-muted">
              <p className="font-medium text-ink">{address.fullName}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
              <p>{[address.postalCode, address.country].filter(Boolean).join(" · ")}</p>
              <p>{address.phone}</p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-brand" /> Order timeline</h2>
            <ol className="mt-3 space-y-2.5">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-2.5 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>
                    <span className="text-ink">{event.message}</span>
                    <span className="block text-[10px] text-muted">{formatDateTime(event.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {canViewOrder && (
            <Link href={`/account/orders/${order.number}`} className="btn-primary">View order details</Link>
          )}
          {!session && (
            <Link href="/register" className="btn-primary">Create an account to track this order</Link>
          )}
          <Link href="/contact" className="btn-outline">Need help?</Link>
        </div>
      </div>
    </div>
  );
}
