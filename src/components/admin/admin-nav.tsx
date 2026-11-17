"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/carts", label: "Abandoned carts", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavContent({ name, storeName }: { name: string; storeName: string }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Logo name={storeName} inverted href="/admin" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white/10 text-white" : "text-cream/65 hover:bg-white/5 hover:text-white",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-3 pb-2 text-[11px] text-cream/45">Signed in as {name}</p>
        <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-cream/65 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-3.5 w-3.5" /> View storefront
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-cream/65 hover:bg-white/5 hover:text-white">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminNav({ name, storeName }: { name: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-dark lg:flex">
        <NavContent name={name} storeName={storeName} />
      </aside>

      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sand bg-white px-4 lg:hidden">
        <Logo name={storeName} href="/admin" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand/60"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-brand-dark">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full text-cream/70 hover:bg-white/10"
              aria-label="Close admin menu"
            >
              <X className="h-4 w-4" />
            </button>
            <NavContent name={name} storeName={storeName} />
          </aside>
        </div>
      )}
    </>
  );
}
