import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Your order history will appear here once you place an order."
        actionHref="/products"
        actionLabel="Browse products"
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand bg-sand/20 px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold">{order.number}</p>
              <p className="text-xs text-muted">Placed {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} kind="payment" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 px-5 py-4">
            <div className="flex -space-x-3">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="relative h-14 w-12 overflow-hidden rounded-lg border-2 border-white bg-sand">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="grid h-14 w-12 place-items-center rounded-lg border-2 border-white bg-sand text-[10px] font-semibold text-muted">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {order.items[0]?.name}
                {order.items.length > 1 ? ` and ${order.items.length - 1} more` : ""}
              </p>
              <p className="mt-0.5 text-xs text-muted">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
            </div>
            <p className="text-sm font-bold">{formatMoney(order.total, order.currency)}</p>
            <Link href={`/account/orders/${order.number}`} className="btn-outline btn-sm">
              Details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
