import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

export type CardProduct = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    reviews: { select: { rating: true; status: true } };
  };
}>;

export function ProductCard({ product, currency = "NGN" }: { product: CardProduct; currency?: string }) {
  const image = product.images[0];
  const approved = product.reviews.filter((review) => review.status === "APPROVED");
  const rating = approved.length > 0 ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length : 0;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100) : 0;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-sand/70">
        <Link href={`/products/${product.slug}`} className="absolute inset-0" aria-label={product.name}>
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition duration-700 group-hover:scale-[1.045]"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted">
              <Sparkles className="h-8 w-8" />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {onSale && <span className="badge bg-gold text-white">−{discount}%</span>}
            {product.stock === 0 && <span className="badge bg-brand-dark text-cream">Sold out</span>}
            {product.isFeatured && !onSale && <span className="badge bg-white/90 text-brand">The edit</span>}
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="badge bg-white/90 text-amber-700">Only {product.stock} left</span>
          )}
        </div>

        {product.stock > 0 && (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <AddToCartButton productId={product.id} stock={product.stock} compact className="w-full bg-white text-ink shadow-soft hover:bg-brand-dark hover:text-white" />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand/70">{product.category.name}</p>
        <h3 className="mt-1 font-display text-[15px] font-semibold leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="transition hover:text-brand">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          {approved.length > 0 ? <Stars rating={rating} count={approved.length} /> : <span className="text-xs text-muted">No reviews yet</span>}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-bold text-ink">{formatMoney(product.price, currency)}</span>
          {onSale && (
            <span className="text-xs text-muted line-through">{formatMoney(product.compareAtPrice as number, currency)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
