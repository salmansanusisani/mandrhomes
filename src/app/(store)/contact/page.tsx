import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the M&R Homes team — we reply within one business day.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">We are here to help</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Contact us</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Questions about an order, a product or a return? Real people read every message. We aim to reply within one
          business day.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a href={`mailto:${settings.supportEmail}`} className="card group p-6 transition hover:border-brand/40">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><Mail className="h-5 w-5" /></span>
            <h2 className="mt-4 text-sm font-semibold">Email us</h2>
            <p className="mt-1 text-sm text-brand group-hover:underline">{settings.supportEmail}</p>
            <p className="mt-2 text-xs text-muted">Best for order issues, returns and product questions.</p>
          </a>
          <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="card group p-6 transition hover:border-brand/40">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><Phone className="h-5 w-5" /></span>
            <h2 className="mt-4 text-sm font-semibold">Call us</h2>
            <p className="mt-1 text-sm text-brand group-hover:underline">{settings.supportPhone}</p>
            <p className="mt-2 text-xs text-muted">Monday to Friday, 9am – 5pm WAT.</p>
          </a>
          <div className="card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><MapPin className="h-5 w-5" /></span>
            <h2 className="mt-4 text-sm font-semibold">Visit</h2>
            <p className="mt-1 text-sm text-muted">{settings.address}</p>
            <p className="mt-2 text-xs text-muted">Pickup by appointment only.</p>
          </div>
          <div className="card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand"><Clock className="h-5 w-5" /></span>
            <h2 className="mt-4 text-sm font-semibold">Response times</h2>
            <p className="mt-1 text-sm text-muted">Email: within 1 business day</p>
            <p className="mt-1 text-sm text-muted">Phone: usually under 5 minutes</p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-brand-dark p-6 text-cream sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5 text-steel" /> Before you write</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/70">
            Most answers live in our help pages. Check shipping times, returns and common questions — it is often faster
            than waiting for a reply.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/faq" className="btn bg-cream text-ink hover:bg-white">Read the FAQ</Link>
            <Link href="/shipping-returns" className="btn border border-cream/20 text-cream hover:bg-cream/10">Shipping &amp; returns</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
