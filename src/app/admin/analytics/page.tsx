import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Globe, MousePointerClick, Percent, ShoppingCart, Users } from "lucide-react";
import { getAnalyticsDashboard } from "@/lib/analytics";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatNumber, truncate } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart, TrafficChart } from "@/components/admin/admin-charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const [data, settings] = await Promise.all([getAnalyticsDashboard(days), getSettings()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Insights</p>
          <h1 className="display mt-1 text-3xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Traffic and conversion for the last {days} days.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-sand bg-white p-1">
          {[7, 30, 90].map((value) => (
            <Link
              key={value}
              href={`/admin/analytics?days=${value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${days === value ? "bg-brand text-white" : "text-muted hover:bg-sand/60"}`}
            >
              {value}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Page views" value={formatNumber(data.totalViews)} hint={`Last ${days} days`} icon={Eye} />
        <StatCard label="Unique visitors" value={formatNumber(data.uniqueVisitors)} icon={Users} />
        <StatCard label="Paid orders" value={formatNumber(data.paidOrders)} icon={ShoppingCart} />
        <StatCard label="Conversion" value={`${data.conversion.toFixed(1)}%`} hint="Paid orders ÷ unique visitors" icon={Percent} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-sand bg-white p-5">
          <h2 className="text-sm font-semibold">Page views</h2>
          <p className="text-[11px] text-muted">Daily traffic across the storefront</p>
          <div className="mt-4"><TrafficChart data={data.series} /></div>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <h2 className="text-sm font-semibold">Revenue</h2>
          <p className="text-[11px] text-muted">Paid orders by day</p>
          <div className="mt-4"><RevenueChart data={data.series} currency={settings.currency} /></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sand bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><MousePointerClick className="h-4 w-4 text-muted" /> Top pages</h2>
          <ul className="mt-4 space-y-3">
            {data.topPages.map((page) => {
              const max = data.topPages[0]?.views || 1;
              return (
                <li key={page.path}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium">{page.path}</span>
                    <span className="shrink-0 text-muted">{formatNumber(page.views)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (page.views / max) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
            {data.topPages.length === 0 && <li className="text-xs text-muted">No page views recorded yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-sand bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Globe className="h-4 w-4 text-muted" /> Referrers</h2>
          <ul className="mt-4 space-y-3">
            {data.referrers.map((referrer) => {
              const max = data.referrers[0]?.visits || 1;
              return (
                <li key={referrer.source}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium">{referrer.source}</span>
                    <span className="shrink-0 text-muted">{formatNumber(referrer.visits)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(4, (referrer.visits / max) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
            {data.referrers.length === 0 && <li className="text-xs text-muted">No referrer data yet.</li>}
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="border-b border-sand px-5 py-4"><h2 className="text-sm font-semibold">Recent visits</h2></div>
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[680px]">
            <thead><tr><th>Path</th><th>Referrer</th><th>Session</th><th>When</th></tr></thead>
            <tbody>
              {data.recentVisits.map((visit) => (
                <tr key={visit.id}>
                  <td className="font-medium">{truncate(visit.path, 60)}</td>
                  <td className="text-xs text-muted">{visit.referrer ? truncate(visit.referrer, 40) : "Direct"}</td>
                  <td className="font-mono text-[10px] text-muted">{visit.sessionId.slice(0, 10)}…</td>
                  <td className="text-xs text-muted">{formatDateTime(visit.createdAt)}</td>
                </tr>
              ))}
              {data.recentVisits.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-sm text-muted">No visits recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
