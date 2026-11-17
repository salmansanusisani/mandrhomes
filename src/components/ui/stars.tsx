import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  size = "sm",
  showValue = false,
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              iconClass,
              value <= Math.round(rating) ? "fill-gold text-gold" : "fill-transparent text-sand-strong",
            )}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>}
      {typeof count === "number" && (
        <span className="text-xs text-muted">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
    </div>
  );
}
