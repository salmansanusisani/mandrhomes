import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("card flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
