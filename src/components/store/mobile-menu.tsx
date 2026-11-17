"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/site/logo";

type MenuCategory = { name: string; slug: string; children: string[] };

export function MobileMenu({
  categories,
  user,
  cartCount,
  storeName,
}: {
  categories: MenuCategory[];
  user: { name: string; role: string } | null;
  cartCount: number;
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-cream/85 transition hover:bg-white/10 hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex">
          <button
            type="button"
            className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative z-10 flex h-full w-[88%] max-w-sm flex-col bg-brand-dark text-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Logo name={storeName} inverted />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-cream/70 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <form action="/products" className="relative mb-6">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  name="q"
                  placeholder="Search plants, decor, furniture…"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted/70"
                  aria-label="Search products"
                />
              </form>

              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-steel">Shop by category</p>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <details key={category.slug} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-cream/85 transition hover:bg-white/5 hover:text-white [&::-webkit-details-marker]:hidden">
                      {category.name}
                      <ChevronRight className="h-4 w-4 text-steel transition group-open:rotate-90" />
                    </summary>
                    <div className="mb-1 space-y-0.5 border-l border-white/10 pl-5">
                      <Link
                        href={`/products?category=${category.slug}`}
                        className="block rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-steel hover:bg-white/5 hover:text-white"
                      >
                        Shop all
                      </Link>
                      {category.children.map((child) => (
                        <Link
                          key={child}
                          href={`/products?category=${category.slug}&tag=${encodeURIComponent(child)}`}
                          className="block rounded-lg px-3 py-1.5 text-sm text-cream/60 hover:bg-white/5 hover:text-white"
                        >
                          {child}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </nav>

              <div className="my-6 h-px bg-white/10" />

              <nav className="space-y-1">
                {user ? (
                  <>
                    <Link href="/account" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                      <User className="h-4 w-4 text-steel" /> My account
                    </Link>
                    <Link href="/account/orders" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                      <Package className="h-4 w-4 text-steel" /> Orders
                    </Link>
                    <Link href="/account/wishlist" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                      <Heart className="h-4 w-4 text-steel" /> Wishlist
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                        <LayoutDashboard className="h-4 w-4 text-steel" /> Admin dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                      <User className="h-4 w-4 text-steel" /> Sign in
                    </Link>
                    <Link href="/register" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                      <User className="h-4 w-4 text-steel" /> Create account
                    </Link>
                  </>
                )}
                <Link href="/cart" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-cream/80 hover:bg-white/5 hover:text-white">
                  <ShoppingBag className="h-4 w-4 text-steel" /> Cart
                  <span className="ml-auto rounded-full bg-steel px-2 py-0.5 text-xs font-semibold text-white">{cartCount}</span>
                </Link>
              </nav>
            </div>

            {user && (
              <div className="border-t border-white/10 px-5 py-4">
                <p className="mb-3 text-xs text-cream/45">Signed in as {user.name}</p>
                <form action={logoutAction}>
                  <button type="submit" className="btn w-full border border-white/15 text-cream hover:bg-white/10">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
