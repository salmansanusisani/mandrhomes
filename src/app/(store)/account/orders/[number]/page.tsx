import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

type Params = Promise<{ number: string }>;

export default async function AccountOrderDetailPage({ params }: { params: Params }) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);

  const order = await prisma.order.findFirst({
    where: { number, userId: user.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string | undefined>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> All orders
          </Link>
          <h2 className="mt-2 text-xl font-bold">{order.number}</h2>
          <p className="text-xs text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} kind="payment" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-sand">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-4">
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
        <dl className="space-y-2 border-t border-sand bg-sand/10 px-5 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd>{formatMoney(order.tax, order.currency)}</dd></div>}
          <div className="flex justify-between border-t border-sand pt-2 text-base font-bold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-brand" /> Delivery address</h3>
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
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-brand" /> Order timeline</h3>
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

      {order.paymentReference && (
        <p className="text-[11px] text-muted">Payment reference: {order.paymentReference}</p>
      )}
      {order.notes && (
        <div className="rounded-xl border border-sand bg-white p-4 text-xs">
          <p className="font-semibold">Order notes</p>
          <p className="mt-1 text-muted">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
