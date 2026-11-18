import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Filter, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClickableRow } from "@/components/admin/clickable-row";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 20;
const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const payment = typeof sp.payment === "string" ? sp.payment : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(payment ? { paymentStatus: payment as Prisma.EnumPaymentStatusFilter["equals"] } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const queryFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (nextPage > 1) params.set("page", String(nextPage));
    const value = params.toString();
    return value ? `/admin/orders?${value}` : "/admin/orders";
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Sales</p>
        <h1 className="display mt-1 text-3xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-muted">{formatNumber(total)} order{total === 1 ? "" : "s"} found.</p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-2xl border border-sand bg-white p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search order number, customer or email…" className="input pl-9" />
        </div>
        <select name="status" defaultValue={status} className="input w-auto min-w-[135px]">
          <option value="">All statuses</option>
          {STATUSES.map((value) => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}
        </select>
        <select name="payment" defaultValue={payment} className="input w-auto min-w-[140px]">
          <option value="">All payments</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <button type="submit" className="btn-outline btn-sm"><Filter className="h-3.5 w-3.5" /> Filter</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[860px]">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th></tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <ClickableRow
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  label={`Open order ${order.number}`}
                  className="hover:bg-sand/20"
                >
                  <td><Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand hover:underline">{order.number}</Link></td>
                  <td>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-[11px] text-muted">{order.email}</p>
                  </td>
                  <td className="text-xs text-muted">{formatDateTime(order.createdAt)}</td>
                  <td className="text-xs">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="font-semibold">{formatMoney(order.total, order.currency)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td><StatusBadge status={order.paymentStatus} kind="payment" /></td>
                </ClickableRow>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-sm text-muted">No orders match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={queryFor(page - 1)} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={queryFor(page + 1)} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
