"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

export function CartItemControls({
  itemId,
  quantity,
  stock,
}: {
  itemId: string;
  quantity: number;
  stock: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    if (pending) return;
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded-full border border-sand-strong bg-white">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-l-full text-muted transition hover:text-ink disabled:opacity-40"
          onClick={() => run(() => updateCartItem(itemId, quantity - 1))}
          disabled={pending}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold">
          {pending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-muted" /> : quantity}
        </span>
        <button
          type="button"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-r-full text-muted transition hover:text-ink",
            quantity >= stock && "cursor-not-allowed opacity-40",
          )}
          onClick={() => run(() => updateCartItem(itemId, quantity + 1))}
          disabled={pending || quantity >= stock}
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => run(() => removeCartItem(itemId))}
        disabled={pending}
        className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
