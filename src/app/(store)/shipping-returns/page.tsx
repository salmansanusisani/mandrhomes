import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: "Delivery times, fees and our 14-day returns policy.",
};

export default async function ShippingReturnsPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Help centre</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Shipping &amp; returns</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Clear timelines, no small print. Here is exactly what to expect after you order.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Delivery</h2>
          <p className="text-sm leading-relaxed text-muted">
            Orders placed before 2pm WAT on a business day are packed and dispatched the same day. Delivery usually takes
            2–5 working days depending on your location. You will receive tracking details by email as soon as your parcel
            leaves our warehouse.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card p-4 text-sm">
              <p className="font-semibold">Lagos &amp; Abuja</p>
              <p className="mt-1 text-xs text-muted">1–2 working days</p>
            </div>
            <div className="card p-4 text-sm">
              <p className="font-semibold">Rest of Nigeria</p>
              <p className="mt-1 text-xs text-muted">3–5 working days</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Delivery is {formatMoney(settings.shippingFlat, settings.currency)} and free on orders over{" "}
            {formatMoney(settings.freeShippingThreshold, settings.currency)}.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Returns</h2>
          <p className="text-sm leading-relaxed text-muted">
            Not happy with your order? You have 14 days from delivery to return unused items in their original packaging
            for a full refund. Start a return by emailing{" "}
            <a href={`mailto:${settings.supportEmail}`} className="text-brand underline">{settings.supportEmail}</a> with
            your order number.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Items must be unused, unwashed and in original packaging.</li>
            <li>For hygiene reasons, used candles and diffusers cannot be returned.</li>
            <li>Refunds are processed within 5–10 business days of us receiving the item.</li>
            <li>Return shipping is free for faulty or incorrect items.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Damaged or wrong item?</h2>
          <p className="text-sm leading-relaxed text-muted">
            We are sorry about that. Email us within 48 hours of delivery with a photo of the item and your order number.
            We will arrange a replacement or refund immediately.
          </p>
          <Link href="/contact" className="btn-primary mt-2">Contact support</Link>
        </section>
      </div>
    </div>
  );
}
