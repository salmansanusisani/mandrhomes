"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

export function BuyBox({
  productId,
  stock,
  saved,
}: {
  productId: string;
  stock: number;
  saved: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(Math.max(stock, 1), 99);

  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-sand-strong bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="grid h-11 w-11 place-items-center rounded-l-full text-muted transition hover:text-ink disabled:opacity-40"
            disabled={quantity <= 1 || stock === 0}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            className="grid h-11 w-11 place-items-center rounded-r-full text-muted transition hover:text-ink disabled:opacity-40"
            disabled={quantity >= max || stock === 0}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <AddToCartButton productId={productId} stock={stock} quantity={quantity} className="h-11 flex-1" />
        <WishlistButton productId={productId} initialSaved={saved} className="h-11 w-11" />
      </div>
      <p className="text-xs text-muted">
        {stock > 0
          ? stock <= 5
            ? `Only ${stock} left in stock — order soon.`
            : "In stock and ready to ship."
          : "Currently sold out. Check back soon."}
      </p>
    </div>
  );
}
