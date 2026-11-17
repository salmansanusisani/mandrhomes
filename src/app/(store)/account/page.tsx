import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatDate, formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");
  const [settings, orders, wishlistCount, address, spent] = await Promise.all([
    getSettings(),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { items: true },
    }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.order.aggregate({ where: { userId: user.id, paymentStatus: "SUCCESS" }, _sum: { total: true } }),
  ]);

  const stats = [
    { label: "Orders placed", value: String(orders.length >= 4 ? "4+" : orders.length), icon: Package, href: "/account/orders" },
    { label: "Wishlist items", value: String(wishlistCount), icon: Heart, href: "/account/wishlist" },
    { label: "Lifetime spend", value: formatMoney(spent._sum.total ?? 0, settings.currency), icon: Wallet, href: "/account/orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-5 transition hover:border-brand/40">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand"><stat.icon className="h-4 w-4" /></span>
            <p className="mt-3 text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Package} title="No orders yet" description="When you place your first order it will show up here." actionHref="/products" actionLabel="Start shopping" className="border-0 py-10" />
          </div>
        ) : (
          <ul className="divide-y divide-sand">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.number}`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-sand/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{order.number}</p>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? "item" : "items"}</p>
                  </div>
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-semibold">{formatMoney(order.total, order.currency)}</p>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand"><MapPin className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-semibold">Default delivery address</h2>
              {address ? (
                <div className="mt-1 text-xs leading-relaxed text-muted">
                  <p className="font-medium text-ink">{address.fullName}</p>
                  <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p>{[address.city, address.state].filter(Boolean).join(", ")} · {address.country}</p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted">No address saved yet. Add one to speed up checkout.</p>
              )}
            </div>
          </div>
          <Link href="/account/addresses" className="text-xs font-semibold text-brand hover:underline">Manage</Link>
        </div>
      </section>
    </div>
  );
}
