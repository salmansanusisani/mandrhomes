"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toggleWishlist } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialSaved = false,
  className,
  showLabel = false,
  label = "Save to wishlist",
}: {
  productId: string;
  initialSaved?: boolean;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.requiresAuth) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result.ok) {
        setSaved(result.added);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : label}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-sand-strong bg-white/90 text-ink backdrop-blur transition hover:border-brand hover:text-brand",
        showLabel ? "px-4 py-2.5 text-sm font-semibold" : "h-10 w-10",
        saved && "border-rose-200 text-rose-600 hover:text-rose-600",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-[18px] w-[18px]", saved && "fill-rose-500 text-rose-500")} />
      )}
      {showLabel && <span>{saved ? "Saved to wishlist" : label}</span>}
    </button>
  );
}
