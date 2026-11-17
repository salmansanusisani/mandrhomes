import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Eye,
  Mail,
  Package,
  Percent,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getDailySeries, getOverview } from "@/lib/analytics";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart, TrafficChart } from "@/components/admin/admin-charts";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function AdminDashboardPage() {
  const settings = await getSettings();
  const [overview, series, lowStock] = await Promise.all([
    getOverview(),
    getDailySeries(30),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: settings.lowStockThreshold } },
      orderBy: { stock: "asc" },
      take: 6,
      include: { images: true },
    }),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Overview</p>
          <h1 className="display mt-1 text-3xl font-semibold">{greeting}, admin.</h1>
          <p className="mt-1 text-sm text-muted">Here is what is happening in {settings.storeName} today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> New product</Link>
          <Link href="/admin/orders" className="btn-outline btn-sm"><ShoppingCart className="h-3.5 w-3.5" /> View orders</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatMoney(overview.revenue, settings.currency)} hint={`${overview.paidOrders} paid orders`} icon={Wallet} tone="success" />
        <StatCard label="Orders" value={formatNumber(overview.totalOrders)} hint={`${overview.pendingOrders} need attention`} icon={ShoppingCart} />
        <StatCard label="Customers" value={formatNumber(overview.customers)} hint={`${overview.viewsToday} visits today`} icon={Users} />
        <StatCard label="Conversion (30d)" value={`${overview.conversion.toFixed(1)}%`} hint={`${formatNumber(overview.uniqueVisitors)} unique visitors`} icon={Percent} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average order value" value={formatMoney(overview.averageOrderValue, settings.currency)} icon={TrendingUp} />
        <StatCard label="Page views (7d)" value={formatNumber(overview.viewsWeek)} icon={Eye} />
        <StatCard label="Pending orders" value={formatNumber(overview.pendingOrders)} icon={Package} tone={overview.pendingOrders > 0 ? "warning" : "default"} />
        <StatCard label="Low stock items" value={formatNumber(overview.lowStock)} icon={Package} tone={overview.lowStock > 0 ? "danger" : "default"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue</h2>
              <p className="text-[11px] text-muted">Paid orders, last 30 days</p>
            </div>
            <Link href="/admin/analytics" className="text-xs font-semibold text-brand hover:underline">Analytics</Link>
          </div>
          <div className="mt-4"><RevenueChart data={series} currency={settings.currency} /></div>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Traffic</h2>
              <p className="text-[11px] text-muted">Page views, last 30 days</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted" />
          </div>
          <div className="mt-4"><TrafficChart data={series} /></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-sand bg-white">
          <div className="flex items-center justify-between border-b border-sand px-5 py-4">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-admin min-w-[620px]">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {overview.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-sand/20">
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand hover:underline">{order.number}</Link>
                    </td>
                    <td>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-[11px] text-muted">{order.email}</p>
                    </td>
                    <td className="text-xs text-muted">{formatDate(order.createdAt)}</td>
                    <td className="font-semibold">{formatMoney(order.total, order.currency)}</td>
                    <td><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
                {overview.recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sm text-muted">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-sm font-semibold">Top products</h2>
            <ul className="mt-4 space-y-3">
              {overview.topProducts.map((product, index) => (
                <li key={product.name} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand text-[10px] font-bold text-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  <span className="shrink-0 text-xs font-semibold">{formatMoney(product.revenue, settings.currency)}</span>
                </li>
              ))}
              {overview.topProducts.length === 0 && <li className="text-xs text-muted">No sales yet.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Low stock</h2>
              <Link href="/admin/products" className="text-xs font-semibold text-brand hover:underline">Manage</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/admin/products/${product.id}`} className="min-w-0 flex-1 truncate hover:text-brand">{product.name}</Link>
                  <span className={`badge shrink-0 ${product.stock === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                    {product.stock === 0 ? "Out" : `${product.stock} left`}
                  </span>
                </li>
              ))}
              {lowStock.length === 0 && <li className="text-xs text-muted">Everything is well stocked.</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/carts" className="rounded-2xl border border-sand bg-white p-5 transition hover:border-brand/40">
          <Mail className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold">Abandoned carts</p>
          <p className="mt-1 text-xs text-muted">Recover sales with follow-up emails.</p>
        </Link>
        <Link href="/admin/reviews" className="rounded-2xl border border-sand bg-white p-5 transition hover:border-brand/40">
          <Package className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold">Review moderation</p>
          <p className="mt-1 text-xs text-muted">Approve or reject customer reviews.</p>
        </Link>
        <Link href="/admin/settings" className="rounded-2xl border border-sand bg-white p-5 transition hover:border-brand/40">
          <Package className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold">Store settings</p>
          <p className="mt-1 text-xs text-muted">Delivery fees, tax and contact details.</p>
        </Link>
      </div>
    </div>
  );
}
