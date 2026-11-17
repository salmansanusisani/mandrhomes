import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/site/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-dark text-cream lg:flex lg:flex-col">
        <Image
          src="/brand/hero-gallery.jpg"
          alt="A considered living room styled by M&R Homes"
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/30" />

        <div className="relative flex flex-1 flex-col p-12">
          <Logo name={settings.storeName} inverted />
          <div className="my-auto max-w-lg">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-steel">
              <Sparkles className="h-3.5 w-3.5" /> The M&amp;R edit
            </p>
            <blockquote className="display mt-5 text-4xl font-semibold leading-[1.08] xl:text-5xl">
              A home should feel collected, not decorated.
            </blockquote>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/65">
              {settings.tagline} Save your favourites, follow your orders and check out in a few quiet clicks.
            </p>
            <div className="mt-10 space-y-4 text-sm text-cream/75">
              <p className="flex items-center gap-3"><Leaf className="h-5 w-5 text-steel" /> Plants and objects chosen with care</p>
              <p className="flex items-center gap-3"><Truck className="h-5 w-5 text-steel" /> Delivery across Abuja and Nigeria</p>
              <p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-steel" /> Secure Paystack payments</p>
            </div>
          </div>
          <p className="text-xs text-cream/40">© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col bg-cream">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
          <div className="lg:hidden">
            <Logo name={settings.storeName} />
          </div>
        </div>
        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="px-5 py-6 text-center text-[11px] text-muted sm:px-8">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
        </footer>
      </div>
    </div>
  );
}
