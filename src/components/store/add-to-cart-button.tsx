"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, ShoppingBag } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

type Status = "idle" | "added" | "error";

export function AddToCartButton({
  productId,
  stock,
  quantity = 1,
  label = "Add to cart",
  className,
  compact = false,
}: {
  productId: string;
  stock: number;
  quantity?: number;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const soldOut = stock <= 0;

  function handleClick() {
    if (soldOut || pending) return;
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      if (result.ok) {
        setStatus("added");
        setMessage("Added to cart");
        router.refresh();
        window.setTimeout(() => setStatus("idle"), 1800);
      } else {
        setStatus("error");
        setMessage(result.message);
        window.setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  const showLabel = compact ? (status === "idle" ? "Add" : status === "added" ? "Added" : "") : status === "idle" ? label : status === "added" ? "Added to cart" : message;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldOut || pending}
      className={cn(
        "btn-primary",
        compact && "px-3 py-1.5 text-xs shadow-soft",
        soldOut && "bg-muted hover:bg-muted",
        status === "added" && "bg-emerald-700",
        status === "error" && "bg-rose-700",
        className,
      )}
      aria-live="polite"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : soldOut ? (
        <AlertCircle className="h-4 w-4" />
      ) : status === "added" ? (
        <Check className="h-4 w-4" />
      ) : status === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <ShoppingBag className="h-4 w-4" />
      )}
      <span className="truncate">{soldOut ? "Sold out" : showLabel || "Add"}</span>
    </button>
  );
}
