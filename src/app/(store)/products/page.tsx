import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getBrandCategory } from "@/lib/brand";
import { absoluteUrl, formatMoney } from "@/lib/utils";
import { jsonLdString } from "@/lib/seo";
import { ProductCard } from "@/components/store/product-card";
import { CatalogFilters, loadFilterCategories } from "@/components/store/catalog-filters";
import { SortSelect } from "@/components/store/sort-select";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const productInclude = {
  images: true,
  category: true,
  reviews: { select: { rating: true, status: true } },
} satisfies Prisma.ProductInclude;

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  "name-asc": [{ name: "asc" }],
};

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const categorySlug = first(params.category);
  const tag = first(params.tag);
  const category = categorySlug ? await prisma.category.findUnique({ where: { slug: categorySlug } }) : null;

  let title = "Shop plants, planters & home decor in Nigeria";
  if (q) title = `Search: ${q}`;
  else if (category && tag) title = `${tag} ${category.name} in Nigeria`;
  else if (category) title = `${category.name} in Nigeria`;

  const canonical = category ? `/products?category=${category.slug}` : "/products";
  const description = category
    ? `${category.description} Buy ${category.name.toLowerCase()} online in Nigeria from M&R Homes, with delivery from our Abuja and Kano showrooms and secure Paystack checkout.`
    : "Browse plants, planters, vases, flowers, decor, rugs and furniture at M&R Homes. Shop online in Nigeria with delivery from Abuja and Kano.";
  const image = category?.image ? absoluteUrl(category.image) : absoluteUrl("/brand/hero-gallery.jpg");

  return {
    title,
    description,
    keywords: category
      ? [
          `${category.name} Nigeria`,
          `buy ${category.name.toLowerCase()} Nigeria`,
          `${category.name} Abuja`,
          `${category.name} Kano`,
          `${category.name} online`,
        ]
      : [
          "home decor Nigeria",
          "plants Nigeria",
          "planters Nigeria",
          "furniture Nigeria",
          "rugs Nigeria",
          "online home store Abuja",
        ],
    alternates: { canonical },
    ...(q ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical),
      title,
      description,
      images: [{ url: image, alt: `${category?.name ?? "M&R Homes"} in Nigeria` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const q = first(raw.q)?.trim() ?? "";
  const categorySlug = first(raw.category) ?? "";
  const tag = first(raw.tag)?.trim() ?? "";
  const sort = first(raw.sort) ?? "featured";
  const min = first(raw.min) ?? "";
  const max = first(raw.max) ?? "";
  const stockOnly = first(raw.stock) === "1";
  const page = Math.max(1, Number(first(raw.page) ?? 1) || 1);

  const minMinor = min !== "" && Number.isFinite(Number(min)) ? Math.round(Number(min) * 100) : undefined;
  const maxMinor = max !== "" && Number.isFinite(Number(max)) ? Math.round(Number(max) * 100) : undefined;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { shortDescription: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(minMinor != null || maxMinor != null
      ? {
          price: {
            ...(minMinor != null ? { gte: minMinor } : {}),
            ...(maxMinor != null ? { lte: maxMinor } : {}),
          },
        }
      : {}),
    ...(stockOnly ? { stock: { gt: 0 } } : {}),
  };

  const [settings, categories, total, products] = await Promise.all([
    getSettings(),
    loadFilterCategories(),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: SORTS[sort] ?? SORTS.featured,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const brandCategory = getBrandCategory(categorySlug);
  const categoryCanonical = activeCategory ? `/products?category=${activeCategory.slug}` : "/products";
  const listingJsonLd = activeCategory
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/products") },
              {
                "@type": "ListItem",
                position: 3,
                name: activeCategory.name,
                item: absoluteUrl(categoryCanonical),
              },
            ],
          },
          {
            "@type": "CollectionPage",
            "@id": absoluteUrl(categoryCanonical),
            url: absoluteUrl(categoryCanonical),
            name: `${activeCategory.name} in Nigeria`,
            description: activeCategory.description,
            isPartOf: { "@type": "WebSite", name: settings.storeName, url: absoluteUrl("/") },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: absoluteUrl(`/products/${product.slug}`),
                name: product.name,
              })),
            },
          },
        ],
      }
    : null;
  const activeTag = tag || undefined;
  const hasFilters = Boolean(q || categorySlug || tag || min || max || stockOnly);
  const filterParams = { q, category: categorySlug, tag, min, max, stock: stockOnly ? "1" : undefined, sort };

  function hrefWith(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...filterParams, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  }

  const pageLinks = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );

  return (
    <div className="container-page py-8 lg:py-12">
      {listingJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(listingJsonLd) }}
        />
      )}

      <nav className="mb-6 flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-ink">Shop</Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="text-ink">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-4xl font-semibold sm:text-5xl">
            {q ? <>Results for “{q}”</> : activeCategory ? activeCategory.name : "Shop all"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {total} {total === 1 ? "product" : "products"}
            {activeTag ? ` · ${activeTag}` : ""}
            {activeCategory?.description ? ` · ${activeCategory.description}` : ""}
          </p>
        </div>
        <SortSelect value={sort} />
      </div>

      {brandCategory && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Shop by</span>
          {brandCategory.children.map((child) => {
            const active = child === activeTag;
            return (
              <Link
                key={child}
                href={hrefWith({ tag: active ? undefined : child })}
                className={
                  active
                    ? "badge bg-brand text-white"
                    : "badge border border-sand-strong bg-white text-muted hover:border-brand hover:text-brand"
                }
              >
                {child}
              </Link>
            );
          })}
        </div>
      )}

      <form action="/products" className="relative mt-6 max-w-xl md:hidden">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="input h-11 rounded-full pl-11"
          aria-label="Search products"
        />
      </form>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </div>
            <CatalogFilters categories={categories} params={filterParams} prefix="desktop" />
          </div>
        </aside>

        <div>
          <details className="mb-6 rounded-xl border border-sand bg-white lg:hidden">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasFilters && <span className="badge bg-brand-soft text-brand">{activeCategory?.name ?? "Active"}</span>}
            </summary>
            <div className="border-t border-sand p-4">
              <CatalogFilters categories={categories} params={filterParams} prefix="mobile" />
            </div>
          </details>

          {hasFilters && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {q && (
                <Link href={hrefWith({ q: undefined, page: undefined })} className="badge bg-white text-muted hover:text-ink">
                  Search: {q} <X className="h-3 w-3" />
                </Link>
              )}
              {activeCategory && (
                <Link href={hrefWith({ category: undefined, tag: undefined })} className="badge bg-white text-muted hover:text-ink">
                  {activeCategory.name} <X className="h-3 w-3" />
                </Link>
              )}
              {activeTag && (
                <Link href={hrefWith({ tag: undefined })} className="badge bg-brand-soft text-brand hover:text-brand-dark">
                  {activeTag} <X className="h-3 w-3" />
                </Link>
              )}
              {(min || max) && (
                <Link href={hrefWith({ min: undefined, max: undefined })} className="badge bg-white text-muted hover:text-ink">
                  {min ? `Min ${formatMoney(Number(min) * 100, settings.currency)}` : ""}
                  {min && max ? " – " : ""}
                  {max ? `Max ${formatMoney(Number(max) * 100, settings.currency)}` : ""}
                  <X className="h-3 w-3" />
                </Link>
              )}
              {stockOnly && (
                <Link href={hrefWith({ stock: undefined })} className="badge bg-white text-muted hover:text-ink">
                  In stock <X className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          {products.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="Try a different search term or clear the filters to see everything in the shop."
              actionHref="/products"
              actionLabel="Clear filters"
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} currency={settings.currency} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <Link
                href={hrefWith({ page: String(Math.max(1, page - 1)) })}
                aria-disabled={page === 1}
                className={page === 1 ? "btn-outline btn-sm pointer-events-none opacity-40" : "btn-outline btn-sm"}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
              {pageLinks.map((value, index) => {
                const previous = pageLinks[index - 1];
                const gap = previous && value - previous > 1;
                return (
                  <span key={value} className="flex items-center gap-1.5">
                    {gap && <span className="px-1 text-xs text-muted">…</span>}
                    <Link
                      href={hrefWith({ page: value === 1 ? undefined : String(value) })}
                      className={
                        value === page
                          ? "grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-semibold text-white"
                          : "grid h-9 w-9 place-items-center rounded-full border border-sand-strong bg-white text-xs font-semibold hover:border-brand"
                      }
                    >
                      {value}
                    </Link>
                  </span>
                );
              })}
              <Link
                href={hrefWith({ page: String(Math.min(totalPages, page + 1)) })}
                aria-disabled={page === totalPages}
                className={page === totalPages ? "btn-outline btn-sm pointer-events-none opacity-40" : "btn-outline btn-sm"}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
