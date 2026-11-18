import type { StoreSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

export function jsonLdString(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function siteJsonLd(settings: StoreSettings) {
  const siteUrl = absoluteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const logoUrl = absoluteUrl("/brand/mr-logo.jpg");
  const imageUrl = absoluteUrl("/brand/hero-gallery.jpg");
  const socialLinks = [settings.instagram, settings.tiktok, settings.x, settings.facebook].filter(Boolean);

  const locations = [
    {
      id: `${siteUrl}/#abuja-showroom`,
      name: `${settings.storeName} Abuja`,
      address: settings.address,
      locality: "Abuja",
      region: "Federal Capital Territory",
    },
    {
      id: `${siteUrl}/#kano-showroom`,
      name: `${settings.storeName} Kano`,
      address: settings.address2,
      locality: "Kano",
      region: "Kano State",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: settings.storeName,
        url: siteUrl,
        logo: logoUrl,
        image: imageUrl,
        description:
          "M&R Homes is a Nigerian home and lifestyle store for plants, planters, vases, flowers, decor, rugs and furniture.",
        email: settings.supportEmail,
        telephone: settings.supportPhone,
        ...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
        areaServed: [
          { "@type": "Country", name: "Nigeria" },
          { "@type": "City", name: "Abuja" },
          { "@type": "City", name: "Kano" },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: settings.supportEmail,
          telephone: settings.supportPhone,
          availableLanguage: "English",
          areaServed: "NG",
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: settings.storeName,
        description: settings.tagline,
        publisher: { "@id": organizationId },
        inLanguage: "en-NG",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      ...locations.map((location) => ({
        "@type": "HomeGoodsStore",
        "@id": location.id,
        name: location.name,
        url: absoluteUrl("/contact"),
        image: imageUrl,
        logo: logoUrl,
        email: settings.supportEmail,
        telephone: settings.supportPhone,
        parentOrganization: { "@id": organizationId },
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: location.locality,
          addressRegion: location.region,
          addressCountry: "NG",
        },
        areaServed: [
          { "@type": "Country", name: "Nigeria" },
          { "@type": "City", name: location.locality },
        ],
        currenciesAccepted: "NGN",
        paymentAccepted: "Card, bank transfer, USSD, Paystack",
        priceRange: "₦₦",
      })),
    ],
  };
}
