import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatDate, formatMoney } from "@/lib/utils";
import { jsonLdString } from "@/lib/seo";
import { ProductGallery } from "@/components/store/product-gallery";
import { BuyBox } from "@/components/store/buy-box";
import { ProductCard } from "@/components/store/product-card";
import { Stars } from "@/components/ui/stars";
import { ReviewForm } from "@/components/store/review-form";

const relatedInclude = {
  images: true,
  category: true,
  reviews: { select: { rating: true, status: true } },
} satisfies Prisma.ProductInclude;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" } }, category: true },
  });
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };

  const canonical = `/products/${product.slug}`;
  const title = `${product.name} — ${product.category.name} in Nigeria`;
  const description =
    product.shortDescription?.trim() ||
    `Shop ${product.name} online in Nigeria with delivery from our Abuja and Kano showrooms. Secure Paystack checkout from M&R Homes.`;
  const image = product.images[0]
    ? { url: absoluteUrl(product.images[0].url), alt: product.images[0].alt ?? product.name }
    : { url: absoluteUrl("/brand/hero-gallery.jpg"), alt: `${product.name} at M&R Homes` };

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} Nigeria`,
      `${product.category.name} Nigeria`,
      `${product.category.name} Abuja`,
      `${product.category.name} Kano`,
      product.brand,
    ].filter((value): value is string => Boolean(value)),
    alternates: { canonical },
    robots: product.isActive ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical),
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const settings = await getSettings();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product || !product.isActive) notFound();

  const [session, related] = await Promise.all([
    getSession(),
    prisma.product.findMany({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      include: relatedInclude,
      take: 4,
      orderBy: { isFeatured: "desc" },
    }),
  ]);

  const [saved, userReview, purchased] = session
    ? await Promise.all([
        prisma.wishlistItem
          .findUnique({ where: { userId_productId: { userId: session.id, productId: product.id } } })
          .then(Boolean),
        prisma.review.findUnique({
          where: { productId_userId: { productId: product.id, userId: session.id } },
          select: { status: true },
        }),
        prisma.orderItem
          .findFirst({
            where: { productId: product.id, order: { userId: session.id, paymentStatus: "SUCCESS" } },
            select: { id: true },
          })
          .then(Boolean),
      ])
    : [false, null, false];

  const reviewCount = product.reviews.length;
  const rating = reviewCount > 0 ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const savings = onSale ? (product.compareAtPrice as number) - product.price : 0;
  const distribution = [5, 4, 3, 2, 1].map((value) => ({
    value,
    count: product.reviews.filter((review) => review.rating === value).length,
  }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/products") },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: absoluteUrl(`/products?category=${product.category.slug}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: absoluteUrl(`/products/${product.slug}`),
      },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url: absoluteUrl(`/products/${product.slug}`),
    sku: product.sku,
    image: product.images.map((image) => absoluteUrl(image.url)),
    brand: { "@type": "Brand", name: product.brand ?? settings.storeName },
    category: product.category.name,
    ...(reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: settings.currency,
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: settings.storeName, url: absoluteUrl("/") },
    },
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />

      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-ink">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/products?category=${product.category.slug}`} className="eyebrow hover:underline">
              {product.category.name}
            </Link>
            {product.brand && <span className="text-xs text-muted">· {product.brand}</span>}
            {product.isFeatured && <span className="badge bg-gold-soft text-gold">Featured</span>}
          </div>

          <h1 className="display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {reviewCount > 0 ? (
              <a href="#reviews" className="flex items-center gap-2">
                <Stars rating={rating} showValue />
                <span className="text-xs text-muted underline-offset-4 hover:underline">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </a>
            ) : (
              <a href="#reviews" className="text-xs text-muted hover:text-brand">Be the first to review</a>
            )}
            <span className="text-xs text-muted">SKU {product.sku}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-ink">{formatMoney(product.price, settings.currency)}</span>
            {onSale && (
              <>
                <span className="text-base text-muted line-through">{formatMoney(product.compareAtPrice as number, settings.currency)}</span>
                <span className="badge bg-rose-50 text-rose-700">Save {formatMoney(savings, settings.currency)}</span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">{product.shortDescription}</p>

          <BuyBox productId={product.id} stock={product.stock} saved={saved} />

          <div className="mt-7 grid gap-3 rounded-2xl border border-sand bg-white p-4 text-xs text-muted sm:grid-cols-2">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand" /> Delivery in 2–5 working days</p>
            <p className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-brand" /> 14-day free returns</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Secure Paystack checkout</p>
            <p className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-brand" /> Quality checked before shipping</p>
          </div>

          <div className="mt-7 divide-y divide-sand border-y border-sand">
            <details open className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                Product details <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-4">
                {product.description.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-muted">{paragraph}</p>
                ))}
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-muted">Brand</dt><dd className="font-medium">{product.brand ?? settings.storeName}</dd></div>
                  <div><dt className="text-muted">Category</dt><dd className="font-medium">{product.category.name}</dd></div>
                  <div><dt className="text-muted">SKU</dt><dd className="font-medium">{product.sku}</dd></div>
                  <div><dt className="text-muted">Availability</dt><dd className="font-medium">{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</dd></div>
                </dl>
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {product.tags.map((tag) => <span key={tag} className="badge bg-sand/60 text-muted">{tag}</span>)}
                  </div>
                )}
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                Shipping &amp; returns <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Free delivery on orders over {formatMoney(settings.freeShippingThreshold, settings.currency)}. Orders are
                dispatched within one business day and arrive in 2–5 working days. Not right? Return it unused within 14
                days for a full refund.
              </p>
            </details>
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-16 scroll-mt-32 border-t border-sand pt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="display text-3xl font-semibold">Customer reviews</h2>
            {reviewCount === 0 ? (
              <p className="mt-3 text-sm text-muted">No reviews yet. If you own this product, share your experience below.</p>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-8 rounded-2xl border border-sand bg-white p-5">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{rating.toFixed(1)}</p>
                    <Stars rating={rating} size="md" className="mt-1 justify-center" />
                    <p className="mt-1 text-xs text-muted">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
                  </div>
                  <div className="min-w-[200px] flex-1 space-y-1.5">
                    {distribution.map((row) => (
                      <div key={row.value} className="flex items-center gap-2 text-xs">
                        <span className="flex w-8 items-center gap-0.5 text-muted">{row.value} <Star className="h-3 w-3 fill-gold text-gold" /></span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${reviewCount ? (row.count / reviewCount) * 100 : 0}%` }} />
                        </div>
                        <span className="w-6 text-right text-muted">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {product.reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-sand bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                            {review.user.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{review.user.name}</p>
                            <p className="text-[11px] text-muted">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <Stars rating={review.rating} />
                      </div>
                      {review.title && <h3 className="mt-3 text-sm font-semibold">{review.title}</h3>}
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{review.body}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5">
            <h2 className="text-lg font-semibold">Write a review</h2>
            {session ? (
              <div className="mt-4">
                {userReview && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    You already reviewed this product{userReview.status === "PENDING" ? " — it is awaiting moderation" : userReview.status === "REJECTED" ? " (not approved)" : ""}. Submitting again will replace it.
                  </p>
                )}
                {purchased && <p className="mb-3 text-xs text-emerald-700">Verified buyer — thank you for shopping with us.</p>}
                <ReviewForm productId={product.id} />
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-muted">Sign in to share your experience with this product.</p>
                <Link href={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`} className="btn-primary mt-4 w-full">
                  Sign in to review
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="display text-3xl font-semibold">You may also like</h2>
            <Link href={`/products?category=${product.category.slug}`} className="text-sm font-semibold text-brand hover:underline">
              More in {product.category.name}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
