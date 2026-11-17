import type { Metadata } from "next";
import Link from "next/link";
import type { EmailStatus, EmailType, Prisma } from "@prisma/client";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime, formatNumber, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Emails" };

const PAGE_SIZE = 25;
const TYPES: EmailType[] = ["WELCOME", "ORDER_CONFIRMATION", "ORDER_STATUS", "ABANDONED_CART", "PASSWORD_RESET", "NEWSLETTER"];

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.EmailLogWhereInput = {
    ...(type ? { type: type as EmailType } : {}),
    ...(status ? { status: status as EmailStatus } : {}),
  };

  const [logs, total, grouped, subscribers, subscriberCount] = await Promise.all([
    prisma.emailLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.emailLog.count({ where }),
    prisma.emailLog.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
  ]);

  const sent = grouped.find((row) => row.status === "SENT")?._count.status ?? 0;
  const failed = grouped.find((row) => row.status === "FAILED")?._count.status ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterQuery = (nextPage: number) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (nextPage > 1) params.set("page", String(nextPage));
    const value = params.toString();
    return value ? `/admin/emails?${value}` : "/admin/emails";
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Communication</p>
        <h1 className="display mt-1 text-3xl font-semibold">Emails</h1>
        <p className="mt-1 text-sm text-muted">Transactional email log and newsletter subscribers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Total logged</p>
          <p className="mt-2 text-xl font-bold">{formatNumber(sent + failed)}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted"><CheckCircle2 className="h-3 w-3" /> Sent</p>
          <p className="mt-2 text-xl font-bold text-emerald-700">{formatNumber(sent)}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted"><AlertCircle className="h-3 w-3" /> Failed</p>
          <p className="mt-2 text-xl font-bold text-rose-700">{formatNumber(failed)}</p>
        </div>
        <div className="rounded-2xl border border-sand bg-white p-5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Newsletter subscribers</p>
          <p className="mt-2 text-xl font-bold">{formatNumber(subscriberCount)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/emails" className={`btn-sm ${!type && !status ? "btn-primary" : "btn-outline"}`}>All</Link>
        {TYPES.map((value) => (
          <Link
            key={value}
            href={`/admin/emails?type=${value}`}
            className={`btn-sm ${type === value ? "btn-primary" : "btn-outline"}`}
          >
            {value.toLowerCase().replace(/_/g, " ")}
          </Link>
        ))}
        <Link href="/admin/emails?status=FAILED" className={`btn-sm ${status === "FAILED" ? "btn-primary" : "btn-outline"}`}>Failed only</Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[860px]">
            <thead><tr><th>Recipient</th><th>Subject</th><th>Type</th><th>Status</th><th>Sent</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs">{log.to}</td>
                  <td className="max-w-[280px]">
                    <p className="truncate font-medium">{log.subject}</p>
                    {log.error && <p className="truncate text-[10px] text-rose-600">{truncate(log.error, 100)}</p>}
                  </td>
                  <td className="text-[11px] text-muted">{log.type.toLowerCase().replace(/_/g, " ")}</td>
                  <td>
                    <span className={`badge ${log.status === "SENT" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {log.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="py-14 text-center text-sm text-muted"><Mail className="mx-auto mb-2 h-7 w-7" />No emails logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={filterQuery(page - 1)} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={filterQuery(page + 1)} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-sand bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Latest newsletter subscribers</h2>
          <span className="text-[11px] text-muted">{subscriberCount} active</span>
        </div>
        <ul className="mt-4 divide-y divide-sand">
          {subscribers.map((subscriber) => (
            <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>{subscriber.email}</span>
              <span className={`text-[11px] ${subscriber.unsubscribedAt ? "text-rose-600" : "text-muted"}`}>
                {subscriber.unsubscribedAt ? "Unsubscribed" : formatDateTime(subscriber.createdAt)}
              </span>
            </li>
          ))}
          {subscribers.length === 0 && <li className="py-2 text-xs text-muted">No subscribers yet.</li>}
        </ul>
      </div>
    </div>
  );
}
