import { cn } from "@/lib/utils";

const ORDER_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-stone-100 text-stone-700",
};

const PAYMENT_STYLES: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
};

const REVIEW_STYLES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

export function StatusBadge({
  status,
  kind = "order",
  className,
}: {
  status: string;
  kind?: "order" | "payment" | "review";
  className?: string;
}) {
  const styles = kind === "payment" ? PAYMENT_STYLES : kind === "review" ? REVIEW_STYLES : ORDER_STYLES;
  return (
    <span className={cn("badge", styles[status] ?? "bg-sand text-muted", className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
