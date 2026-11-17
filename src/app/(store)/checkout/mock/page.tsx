import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FlaskConical, Lock, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { paymentsAreMock } from "@/lib/paystack";
import { formatMoney } from "@/lib/utils";
import { completeMockPaymentAction, cancelMockPaymentAction } from "@/app/actions/checkout";

export const metadata: Metadata = { title: "Mock payment", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MockPaymentPage({ searchParams }: { searchParams: SearchParams }) {
  if (!paymentsAreMock()) redirect("/");

  const params = await searchParams;
  const reference = typeof params.reference === "string" ? params.reference : "";
  if (!reference) redirect("/cart");

  const order = await prisma.order.findUnique({
    where: { paymentReference: reference },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <FlaskConical className="h-4 w-4 shrink-0" />
          Development mode — no real money will be charged. Add Paystack keys and set PAYSTACK_MOCK=false for live payments.
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-sand bg-white px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mock Paystack checkout</p>
            <h1 className="mt-1 text-2xl font-semibold">Confirm your payment</h1>
            <p className="mt-1 text-xs text-muted">Order {order.number}</p>
          </div>

          <div className="space-y-2 px-6 py-5 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-muted">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatMoney(item.price * item.quantity, order.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-sand pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatMoney(order.total, order.currency)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-sand px-6 py-5">
            <form action={completeMockPaymentAction}>
              <input type="hidden" name="reference" value={reference} />
              <button type="submit" className="btn-primary h-12 w-full">
                <Lock className="h-4 w-4" /> Simulate successful payment
              </button>
            </form>
            <form action={cancelMockPaymentAction}>
              <input type="hidden" name="reference" value={reference} />
              <button type="submit" className="btn-ghost w-full text-muted">
                <X className="h-4 w-4" /> Cancel payment
              </button>
            </form>
            <p className="pt-1 text-center text-[11px] text-muted">
              In production you would be on Paystack&apos;s secure page. <Link href="/contact" className="underline">Need help?</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
