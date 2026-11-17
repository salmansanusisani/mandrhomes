import { Heart } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/store/product-card";
import { WishlistRemoveButton } from "@/components/store/wishlist-remove-button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const [settings, items] = await Promise.all([
    getSettings(),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            reviews: { select: { rating: true, status: true } },
          },
        },
      },
    }),
  ]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it for later. Items you love, all in one place."
        actionHref="/products"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved items</h2>
        <p className="text-xs text-muted">{items.length} {items.length === 1 ? "item" : "items"}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.id}>
            <ProductCard product={item.product} currency={settings.currency} />
            <WishlistRemoveButton productId={item.productId} />
          </div>
        ))}
      </div>
    </div>
  );
}
