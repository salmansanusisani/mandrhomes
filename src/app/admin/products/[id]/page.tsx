import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteProductAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand">
            <ChevronLeft className="h-3.5 w-3.5" /> Products
          </Link>
          <h1 className="display mt-2 text-3xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-muted">{product.sku}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline btn-sm">
            <ExternalLink className="h-3.5 w-3.5" /> View
          </Link>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton
              label="Delete product"
              message={`Delete ${product.name}? This cannot be undone.`}
              className="btn-outline btn-sm border-rose-200 text-rose-700 hover:bg-rose-50"
            />
          </form>
        </div>
      </div>

      {sp.saved === "1" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Product saved successfully.
        </div>
      )}

      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          brand: product.brand ?? "",
          tags: product.tags,
          images: product.images.map((image) => image.url),
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}
