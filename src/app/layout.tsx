import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${settings.storeName} — ${settings.tagline}`,
      template: `%s · ${settings.storeName}`,
    },
    description:
      "Curated plants, planters, flowers, decor, rugs and furniture for considered living. Secure checkout with Paystack and delivery across Nigeria.",
    applicationName: settings.storeName,
    keywords: ["M&R Homes", "plants Abuja", "planters", "home decor Nigeria", "furniture Abuja", "rugs", settings.storeName],
    icons: { icon: "/brand/favicon.ico" },
    openGraph: {
      type: "website",
      siteName: settings.storeName,
      title: `${settings.storeName} — ${settings.tagline}`,
      description: "Plants, planters and objects for a home with a point of view.",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.storeName} — ${settings.tagline}`,
      description: "Plants, planters and objects for a home with a point of view.",
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
