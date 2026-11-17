import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  name = "M&R Homes",
  href = "/",
  inverted = false,
  showWordmark = true,
  markClassName = "h-10 sm:h-11",
  className,
}: {
  name?: string;
  href?: string;
  inverted?: boolean;
  showWordmark?: boolean;
  markClassName?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)} aria-label={`${name} home`}>
      <Image
        src={inverted ? "/brand/mr-mark-white.png" : "/brand/mr-mark-navy.png"}
        alt=""
        width={1126}
        height={582}
        className={cn(markClassName, "w-auto shrink-0 transition duration-500 group-hover:scale-[1.03]")}
        priority
      />
      {showWordmark && (
      <span className="hidden min-w-0 flex-col leading-none sm:flex">
        <span
          className={cn(
            "font-display text-[15px] font-semibold uppercase tracking-[0.2em]",
            inverted ? "text-cream" : "text-ink",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "mt-1.5 text-[8px] font-semibold uppercase tracking-[0.34em]",
            inverted ? "text-steel" : "text-muted",
          )}
        >
          Home &amp; Lifestyle
        </span>
      </span>
      )}
    </Link>
  );
}
