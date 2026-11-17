"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { removeWishlistItem } from "@/app/actions/cart";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await removeWishlistItem(productId);
          router.refresh();
        })
      }
      disabled={pending}
      className="btn-ghost btn-sm mt-2 w-full text-muted hover:text-rose-600"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
      Remove
    </button>
  );
}
