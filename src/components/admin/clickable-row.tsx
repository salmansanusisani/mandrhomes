"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

export function ClickableRow({
  href,
  label,
  children,
  className = "",
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const open = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    router.push(href);
  };

  const openWithKeyboard = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    router.push(href);
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={open}
      onKeyDown={openWithKeyboard}
      className={`cursor-pointer outline-none focus-visible:bg-sand/40 ${className}`}
    >
      {children}
    </tr>
  );
}
