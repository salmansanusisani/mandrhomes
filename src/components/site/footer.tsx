import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FacebookIcon, InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from "@/components/site/social-icons";
import { getSettings } from "@/lib/settings";
import { brandCategories } from "@/lib/brand";
import { Logo } from "@/components/site/logo";
import { NewsletterForm } from "@/components/store/newsletter-form";

export async function SiteFooter() {
  const settings = await getSettings();

  return (
    <footer className="mt-24 bg-brand-dark text-cream/75">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.45fr_1fr_1fr_1.25fr]">
        <div>
          <Logo name={settings.storeName} inverted />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/55">{settings.tagline}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {settings.instagram && (
              <a href={settings.instagram} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition hover:border-steel hover:bg-steel hover:text-white" aria-label="Instagram" target="_blank" rel="noreferrer">
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {settings.tiktok && (
              <a href={settings.tiktok} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition hover:border-steel hover:bg-steel hover:text-white" aria-label="TikTok" target="_blank" rel="noreferrer">
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition hover:border-steel hover:bg-steel hover:text-white" aria-label="Facebook" target="_blank" rel="noreferrer">
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
            {settings.youtube && (
              <a href={settings.youtube} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition hover:border-steel hover:bg-steel hover:text-white" aria-label="YouTube" target="_blank" rel="noreferrer">
                <YouTubeIcon className="h-[18px] w-[18px]" />
              </a>
            )}
            {settings.x && (
              <a href={settings.x} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-cream/70 transition hover:border-steel hover:bg-steel hover:text-white" aria-label="X" target="_blank" rel="noreferrer">
                <XIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="mt-7 space-y-2.5 text-xs leading-relaxed text-cream/50">
            <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" /> {settings.address}</p>
            <p className="flex items-center gap-2.5"><Mail className="h-3.5 w-3.5 text-steel" /> {settings.supportEmail}</p>
            <p className="flex items-center gap-2.5"><Phone className="h-3.5 w-3.5 text-steel" /> {settings.supportPhone}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-steel">Shop</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {brandCategories.map((category) => (
              <li key={category.slug}>
                <Link href={`/products?category=${category.slug}`} className="text-cream/60 transition hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-steel">Help</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/contact" className="text-cream/60 transition hover:text-white">Contact us</Link></li>
            <li><Link href="/shipping-returns" className="text-cream/60 transition hover:text-white">Shipping &amp; returns</Link></li>
            <li><Link href="/faq" className="text-cream/60 transition hover:text-white">FAQ</Link></li>
            <li><Link href="/account/orders" className="text-cream/60 transition hover:text-white">Track your order</Link></li>
            <li><Link href="/privacy" className="text-cream/60 transition hover:text-white">Privacy policy</Link></li>
            <li><Link href="/terms" className="text-cream/60 transition hover:text-white">Terms of service</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-steel">Stay in the loop</h3>
          <p className="mb-4 text-sm leading-relaxed text-cream/55">
            New arrivals, styling notes and quiet offers — delivered occasionally, never noisily.
          </p>
          <NewsletterForm compact />
          <p className="mt-3 text-[11px] text-cream/35">No spam. Unsubscribe any time.</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-[11px] text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-steel" /> Secure payments by Paystack
          </p>
        </div>
      </div>
    </footer>
  );
}
