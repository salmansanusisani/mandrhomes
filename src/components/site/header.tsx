import Link from "next/link";
import { ChevronDown, Heart, Search, ShoppingBag, User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { brandCategories } from "@/lib/brand";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/store/mobile-menu";

export async function SiteHeader() {
  const [session, cart, settings] = await Promise.all([getSession(), getCart(), getSettings()]);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-50 bg-brand-dark text-cream shadow-lg shadow-brand-dark/10">
      <div className="container-page relative flex h-[74px] items-center justify-between gap-4 lg:h-[88px]">
        <div className="flex items-center gap-1 text-cream">
          <MobileMenu
            categories={brandCategories}
            user={session ? { name: session.name, role: session.role } : null}
            cartCount={cartCount}
            storeName={settings.storeName}
          />

          <details className="group relative hidden lg:block">
            <summary
              className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden"
              aria-label="Search products"
            >
              <Search className="h-[19px] w-[19px]" />
            </summary>
            <form action="/products" className="absolute left-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-white p-3 shadow-lift">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search plants, decor, furniture…"
                  aria-label="Search products"
                  className="h-11 w-full rounded-xl border border-sand bg-cream pl-10 pr-3 text-sm text-ink outline-none focus:border-brand"
                  autoFocus
                />
              </div>
            </form>
          </details>

          <Link
            href="/products"
            className="grid h-10 w-10 place-items-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Search products"
          >
            <Search className="h-[19px] w-[19px]" />
          </Link>
        </div>

        <Logo
          name={settings.storeName}
          inverted
          showWordmark={false}
          markClassName="h-12 lg:h-14"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />

        <div className="flex items-center gap-0.5 text-cream">
          <Link
            href={session ? "/account" : "/login"}
            className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-cream/85 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <User className="h-[19px] w-[19px]" />
            <span className="hidden xl:inline">{session ? session.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          <Link
            href="/account/wishlist"
            className="hidden h-10 w-10 place-items-center rounded-full text-cream/85 transition hover:bg-white/10 hover:text-white sm:grid"
            aria-label="Wishlist"
          >
            <Heart className="h-[19px] w-[19px]" />
          </Link>
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-cream/85 transition hover:bg-white/10 hover:text-white"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag className="h-[19px] w-[19px]" />
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-steel px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-white/10 bg-[#0b1335] lg:block">
        <div className="container-page flex h-12 items-center justify-center gap-1 xl:gap-4">
          {brandCategories.map((category) => (
            <div key={category.slug} className="group relative">
              <Link
                href={`/products?category=${category.slug}`}
                className="flex h-12 items-center gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-cream/80 transition hover:text-white xl:px-3"
              >
                {category.name}
                <ChevronDown className="h-3 w-3 text-steel transition group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 rounded-b-2xl border border-t-0 border-white/10 bg-brand-dark p-2 opacity-0 shadow-lift transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="block rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-steel hover:bg-white/5 hover:text-white"
                >
                  Shop all {category.name}
                </Link>
                <div className="my-1 h-px bg-white/10" />
                {category.children.map((child) => (
                  <Link
                    key={child}
                    href={`/products?category=${category.slug}&tag=${encodeURIComponent(child)}`}
                    className="block rounded-lg px-3 py-2 text-sm text-cream/70 transition hover:bg-white/5 hover:text-white"
                  >
                    {child}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link
            href="/products?sort=newest"
            className="ml-2 whitespace-nowrap border-l border-white/10 pl-4 text-[11px] font-semibold uppercase tracking-[0.13em] text-steel transition hover:text-white"
          >
            New in
          </Link>
        </div>
      </nav>
    </header>
  );
}
