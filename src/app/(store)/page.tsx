import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, formatMoney } from "@/lib/utils";
import { HeroSlideshow } from "@/components/store/hero-slideshow";
import { ProductCard } from "@/components/store/product-card";
import { NewsletterForm } from "@/components/store/newsletter-form";

const productInclude = {
  images: true,
  category: true,
  reviews: { select: { rating: true, status: true } },
} satisfies Prisma.ProductInclude;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = `${settings.storeName} | Plants, Planters & Home Decor in Nigeria`;
  const description =
    "Shop curated plants, planters, vases, flowers, rugs, furniture and home decor in Nigeria. Visit our Abuja and Kano showrooms or order online with nationwide delivery and secure Paystack checkout.";

  return {
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.storeName,
      title,
      description,
      url: absoluteUrl("/"),
      locale: "en_NG",
      images: [
        {
          url: absoluteUrl("/brand/hero-gallery.jpg"),
          width: 2888,
          height: 1612,
          alt: "M&R Homes plants, decor and furniture in Abuja and Kano",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/brand/hero-gallery.jpg")],
    },
  };
}

export default async function HomePage() {
  const [settings, categories, featured, newest, testimonials] = await Promise.all([
    getSettings(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
    }),
  ]);

  const currency = settings.currency;

  return (
    <>
      <HeroSlideshow />

      <section className="container-page py-16 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Browse the house</p>
            <h2 className="display mt-3 text-3xl font-semibold sm:text-5xl">Shop plants &amp; home decor</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            From living greenery to the last considered object on the shelf — eight collections, with delivery from
            our Abuja and Kano showrooms across Nigeria.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand"
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4">
                <p className="font-display text-xl text-white">{category.name}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {category._count.products} pieces
                </p>
              </div>
              <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/10 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The M&amp;R edit</p>
            <h2 className="display mt-3 text-3xl font-semibold sm:text-5xl">Pieces we would live with</h2>
          </div>
          <Link href="/products?sort=featured" className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline sm:flex">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-brand-soft lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[420px]">
            <Image
              src="/brand/hero-plants.jpg"
              alt="A shelf of lush plants and textured planters"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-brand-dark/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              The green edit
            </div>
          </div>
          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14 lg:py-16">
            <p className="eyebrow">Styled by M&amp;R</p>
            <h2 className="display mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Green, but make it considered.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              Layer leaf shape, height and texture rather than simply filling a corner. Our plants and planters are
              chosen to work together — sculptural on their own, richer as a collection.
            </p>
            <div className="mt-7 grid gap-3 text-xs text-ink/70 sm:grid-cols-2">
              <p className="flex items-center gap-2.5"><Leaf className="h-4 w-4 text-brand" /> Living &amp; preserved greenery</p>
              <p className="flex items-center gap-2.5"><Sparkles className="h-4 w-4 text-brand" /> Hand-finished surfaces</p>
            </div>
            <div className="mt-9">
              <Link href="/products?category=plants" className="btn-primary h-12 px-6">
                Shop plants &amp; planters <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 lg:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">Just landed</p>
            <h2 className="display mt-3 text-3xl font-semibold sm:text-5xl">New in the house</h2>
          </div>
          <Link href="/products?sort=newest" className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {newest.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      </section>

      <section className="border-y border-sand bg-white/60">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, title: "Sourced with intent", copy: "A tight edit of pieces chosen for form, texture and daily life." },
            { icon: Truck, title: "Delivery across Nigeria", copy: `From ${formatMoney(settings.abujaShippingFee, currency)} in Abuja · free over ${formatMoney(settings.freeShippingThreshold, currency)}.` },
            { icon: ShieldCheck, title: "Secure payments", copy: "Card, transfer and USSD via Paystack." },
            { icon: Sparkles, title: "Real styling help", copy: "Tell us the room. We will help you pull it together." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-9 text-center">
            <p className="eyebrow">Word of mouth</p>
            <h2 className="display mt-3 text-3xl font-semibold sm:text-5xl">Notes from the house</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((review) => (
              <figure key={review.id} className="card flex flex-col p-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} className={value <= review.rating ? "h-3.5 w-3.5 fill-gold text-gold" : "h-3.5 w-3.5 text-sand-strong"} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/75">“{review.body}”</blockquote>
                <figcaption className="mt-5 text-xs">
                  <span className="font-semibold text-ink">{review.user.name}</span>
                  <span className="text-muted"> · </span>
                  <Link href={`/products/${review.product.slug}`} className="text-brand hover:underline">
                    {review.product.name}
                  </Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="container-page pb-8 pt-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-dark px-6 py-14 text-cream sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-16 font-display text-[14rem] leading-none text-white/[0.03]">M&amp;R</div>
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-steel">The list</p>
              <h2 className="display mt-3 text-3xl font-semibold sm:text-4xl">A slower kind of inbox.</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/60">
                New arrivals, styling notes and the occasional quiet offer. Join the list and take your time.
              </p>
            </div>
            <div className="lg:justify-self-end lg:w-full lg:max-w-md">
              <NewsletterForm source="home" />
              <p className="mt-3 text-[11px] text-cream/35">No spam. Unsubscribe any time.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
