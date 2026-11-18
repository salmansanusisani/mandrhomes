import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { jsonLdString, siteJsonLd } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const defaultTitle = `${settings.storeName} | Plants, Planters & Home Decor in Nigeria`;
  const description =
    "Shop curated plants, planters, vases, flowers, rugs, furniture and home decor in Nigeria. Visit our Abuja and Kano showrooms or order online with nationwide delivery and secure Paystack checkout.";
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: defaultTitle,
      template: `%s · ${settings.storeName}`,
    },
    description,
    applicationName: settings.storeName,
    keywords: [
      "M&R Homes",
      "plants Nigeria",
      "buy plants online Nigeria",
      "plants Abuja",
      "plants Kano",
      "planters Nigeria",
      "home decor Nigeria",
      "home decor Abuja",
      "home decor Kano",
      "furniture Nigeria",
      "rugs Nigeria",
      "vases Nigeria",
      "flowers Abuja",
      settings.storeName,
    ],
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return (
    <html lang="en-NG">
      <body className="min-h-screen antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd(settings)) }}
        />
      </body>
    </html>
  );
}
