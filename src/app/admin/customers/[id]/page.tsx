import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Phone, Star, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, formatMoney, initials } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Stars } from "@/components/ui/stars";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, spend] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
        reviews: { orderBy: { createdAt: "desc" }, take: 10, include: { product: { select: { name: true, slug: true } } } },
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
    }),
    prisma.order.aggregate({ where: { userId: id, paymentStatus: "SUCCESS" }, _sum: { total: true } }),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/customers" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand">
          <ChevronLeft className="h-3.5 w-3.5" /> Customers
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand">{initials(customer.name)}</span>
          <div>
            <h1 className="display text-3xl font-semibold">{customer.name}</h1>
            <p className="text-sm text-muted">Customer since {formatDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-sand bg-white p-5">
          <Wallet className="h-4 w-4 text-brand" />
          <p className="mt-3 text-[11px] uppercase tracking-wide text-muted">Lifetime spend</p>
          <p className="text-xl font-bold">{formatMoney(spend._sum.total ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Orders</p>
          <p className="mt-3 text-xl font-bold">{customer._count.orders}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Reviews</p>
          <p className="mt-3 text-xl font-bold">{customer._count.reviews}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Wishlist items</p>
          <p className="mt-3 text-xl font-bold">{customer._count.wishlist}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-sand bg-white">
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <h2 className="text-sm font-semibold">Recent orders</h2>
              <Link href={`/admin/orders?q=${encodeURIComponent(customer.email)}`} className="text-xs font-semibold text-brand hover:underline">All orders</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table-admin min-w-[520px]">
                <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td><Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand hover:underline">{order.number}</Link></td>
                      <td className="text-xs text-muted">{formatDate(order.createdAt)}</td>
                      <td>{formatMoney(order.total, order.currency)}</td>
                      <td><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                  {customer.orders.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-muted">No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Recent reviews</h2>
            <ul className="mt-4 divide-y divide-sand">
              {customer.reviews.map((review) => (
                <li key={review.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/products/${review.product.slug}`} target="_blank" className="text-sm font-medium hover:text-brand">{review.product.name}</Link>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{review.body}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                    <StatusBadge status={review.status} kind="review" />
                    {formatDate(review.createdAt)}
                  </div>
                </li>
              ))}
              {customer.reviews.length === 0 && <li className="py-2 text-xs text-muted">No reviews yet.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Contact</h2>
            <div className="mt-3 space-y-2 text-xs text-muted">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {customer.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {customer.phone ?? "No phone"}</p>
              <p className="flex items-center gap-2"><Star className="h-3.5 w-3.5" /> Role: {customer.role.toLowerCase()}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-muted" /> Addresses</h2>
            <div className="mt-3 space-y-4">
              {customer.addresses.map((address) => (
                <div key={address.id} className="rounded-xl bg-sand/40 p-3 text-xs">
                  <p className="font-semibold">{address.label ?? address.fullName} {address.isDefault && <span className="badge ml-1 bg-white text-brand">Default</span>}</p>
                  <p className="mt-1 text-muted">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p className="text-muted">{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}, {address.country}</p>
                  <p className="mt-1 text-muted">{address.phone}</p>
                </div>
              ))}
              {customer.addresses.length === 0 && <p className="text-xs text-muted">No saved addresses.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5 text-xs text-muted">
            <p>Last updated {formatDateTime(customer.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
