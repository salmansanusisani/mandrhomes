import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, Send, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatMoney, timeAgo } from "@/lib/utils";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { runAllCartRemindersAction, sendCartReminderAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Abandoned carts" };

export default async function AdminCartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  const reminded = typeof sp.reminded === "string" ? Number(sp.reminded) : null;
  const failed = typeof sp.failed === "string" ? Number(sp.failed) : null;

  const carts = await prisma.cart.findMany({
    where: { status: { in: ["ACTIVE", "ABANDONED"] }, items: { some: {} }, email: { not: null } },
    orderBy: { updatedAt: "asc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true } },
      items: { include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Recovery</p>
          <h1 className="display mt-1 text-3xl font-semibold">Abandoned carts</h1>
          <p className="mt-1 text-sm text-muted">
            Carts with items and no checkout for {settings.abandonedCartHours}h are eligible for follow-up emails.
          </p>
        </div>
        <form action={runAllCartRemindersAction}>
          <ConfirmButton label="Run all reminders" message="Send reminder emails to all eligible abandoned carts now?" className="btn-primary btn-sm" />
        </form>
      </div>

      {reminded != null && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Reminder run complete: {reminded} sent{failed ? `, ${failed} failed` : ""}.
        </div>
      )}

      <div className="grid gap-3">
        {carts.map((cart) => {
          const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
          return (
            <div key={cart.id} className="rounded-2xl border border-sand bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{cart.email}</h2>
                    <span className={`badge ${cart.status === "ABANDONED" ? "bg-amber-50 text-amber-700" : "bg-sand text-muted"}`}>
                      {cart.status === "ABANDONED" ? "Abandoned" : "Active"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {cart.user?.name ? `Customer: ${cart.user.name} · ` : "Guest cart · "}
                    Updated {timeAgo(cart.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{formatMoney(subtotal, settings.currency)}</span>
                  <form action={sendCartReminderAction}>
                    <input type="hidden" name="cartId" value={cart.id} />
                    <button type="submit" className="btn-outline btn-sm"><Send className="h-3.5 w-3.5" /> Send reminder</button>
                  </form>
                </div>
              </div>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-xl bg-sand/30 p-2 text-xs">
                    <ShoppingBag className="h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{item.product.name}</span>
                    <span className="shrink-0 text-muted">×{item.quantity}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-sand pt-3 text-[11px] text-muted">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {cart.reminderCount}/{settings.abandonedCartMaxReminders} reminders sent</span>
                {cart.lastReminderAt && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last {timeAgo(cart.lastReminderAt)}</span>}
                {cart.user && <Link href={`/admin/customers/${cart.user.id}`} className="font-semibold text-brand hover:underline">View customer</Link>}
                <Link href={`/cart/recover?token=${cart.recoveryToken}`} target="_blank" className="font-semibold text-brand hover:underline">Open recovery link</Link>
              </div>
            </div>
          );
        })}
        {carts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-sand bg-white py-14 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">No carts are waiting for recovery.</p>
          </div>
        )}
      </div>
    </div>
  );
}
