import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PrintButton } from "@/components/admin/print-button";
import {
  markOrderPaidManuallyAction,
  resendOrderConfirmationAction,
  updateOrderStatusAction,
} from "@/app/actions/admin";

export const metadata: Metadata = { title: "Order details" };

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) notFound();

  const address = (order.shippingAddress ?? {}) as Record<string, string>;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-5 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand">
            <ChevronLeft className="h-3.5 w-3.5" /> Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="display text-3xl font-semibold">{order.number}</h1>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} kind="payment" />
          </div>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <form action={resendOrderConfirmationAction}>
            <input type="hidden" name="id" value={order.id} />
            <button type="submit" className="btn-outline btn-sm"><Mail className="h-3.5 w-3.5" /> Resend email</button>
          </form>
          {order.paymentStatus !== "SUCCESS" && (
            <form action={markOrderPaidManuallyAction}>
              <input type="hidden" name="id" value={order.id} />
              <ConfirmButton
                label="Mark as paid"
                message="Mark this order as paid manually? Stock will be decremented and a confirmation email sent."
                className="btn-primary btn-sm"
              />
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-sand bg-white">
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <h2 className="text-sm font-semibold">Items ({itemCount})</h2>
              <span className="print:hidden text-[11px] text-muted">Prices in {order.currency}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="table-admin min-w-[560px]">
                <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium">{item.name}</p>
                        {item.productId && (
                          <Link href={`/admin/products/${item.productId}`} className="text-[11px] text-brand hover:underline print:hidden">View product</Link>
                        )}
                      </td>
                      <td>{formatMoney(item.price, order.currency)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-right font-semibold">{formatMoney(item.price * item.quantity, order.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="space-y-2 border-t border-sand px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(order.tax, order.currency)}</dd></div>
              <div className="flex justify-between border-t border-sand pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
            </dl>
          </div>

          {order.notes && (
            <div className="rounded-2xl border border-sand bg-white p-5">
              <h2 className="text-sm font-semibold">Customer notes</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{order.notes}</p>
            </div>
          )}

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Timeline</h2>
            <ol className="mt-4 space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p>{event.message}</p>
                    <p className="text-[11px] text-muted">
                      {formatDateTime(event.createdAt)}
                      {event.actorName && (
                        <> · by <span className="font-medium text-ink">{event.actorName}</span>{event.actorRole ? ` (${label(event.actorRole)})` : ""}</>
                      )}
                    </p>
                  </div>
                </li>
              ))}
              {order.events.length === 0 && <li className="text-xs text-muted">No events yet.</li>}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Update status</h2>
            <form action={updateOrderStatusAction} className="mt-3 flex gap-2 print:hidden">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className="input">
                {STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
              </select>
              <button type="submit" className="btn-primary btn-sm">Save</button>
            </form>
            <dl className="mt-4 space-y-2 border-t border-sand pt-4 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted">Payment</dt><dd><StatusBadge status={order.paymentStatus} kind="payment" /></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Reference</dt><dd className="max-w-[180px] truncate font-mono text-[10px]">{order.paymentReference ?? "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Paid at</dt><dd>{order.paidAt ? formatDateTime(order.paidAt) : "—"}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Customer</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium"><UserRound className="h-4 w-4 text-muted" /> {order.customerName}</p>
              <p className="flex items-center gap-2 text-xs text-muted"><Mail className="h-3.5 w-3.5" /> {order.email}</p>
              {order.phone && <p className="flex items-center gap-2 text-xs text-muted"><Phone className="h-3.5 w-3.5" /> {order.phone}</p>}
              {order.user && (
                <Link href={`/admin/customers/${order.user.id}`} className="inline-block pt-1 text-xs font-semibold text-brand hover:underline print:hidden">
                  View customer profile
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-muted" /> Delivery address</h2>
            <address className="mt-3 space-y-0.5 text-xs not-italic text-muted">
              <p className="font-medium text-ink">{address.fullName ?? order.customerName}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
              <p>{address.country}</p>
              {address.phone && <p className="pt-1">{address.phone}</p>}
            </address>
          </div>

          {order.paymentStatus === "SUCCESS" && (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800 print:bg-transparent print:p-0">
              <CheckCircle2 className="h-4 w-4" /> Payment confirmed for this order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
