import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney, formatNumber, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    role: "CUSTOMER" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { orders: { select: { total: true, paymentStatus: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">People</p>
        <h1 className="display mt-1 text-3xl font-semibold">Customers</h1>
        <p className="mt-1 text-sm text-muted">{formatNumber(total)} registered customer{total === 1 ? "" : "s"}.</p>
      </div>

      <form method="get" className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder="Search name, email or phone…" className="input bg-white pl-9" />
      </form>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[720px]">
            <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Lifetime spend</th></tr></thead>
            <tbody>
              {customers.map((customer) => {
                const spend = customer.orders.filter((order) => order.paymentStatus === "SUCCESS").reduce((sum, order) => sum + order.total, 0);
                return (
                  <tr key={customer.id} className="hover:bg-sand/20">
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
                          {initials(customer.name)}
                        </span>
                        <div>
                          <Link href={`/admin/customers/${customer.id}`} className="font-semibold hover:text-brand">{customer.name}</Link>
                          <p className="text-[11px] text-muted">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-muted">{customer.phone ?? "—"}</td>
                    <td className="text-xs text-muted">{formatDate(customer.createdAt)}</td>
                    <td>{customer.orders.length}</td>
                    <td className="font-semibold">{formatMoney(spend)}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="py-14 text-center text-sm text-muted"><Users className="mx-auto mb-2 h-7 w-7" />No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={q ? `/admin/customers?q=${encodeURIComponent(q)}&page=${page - 1}` : `/admin/customers?page=${page - 1}`} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={q ? `/admin/customers?q=${encodeURIComponent(q)}&page=${page + 1}` : `/admin/customers?page=${page + 1}`} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
