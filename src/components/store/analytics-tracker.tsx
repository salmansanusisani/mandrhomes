"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const key = `sw_track:${pathname}`;
    try {
      const previous = window.sessionStorage.getItem(key);
      if (previous && Date.now() - Number(previous) < 4000) return;
      window.sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // storage unavailable — still track
    }

    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
