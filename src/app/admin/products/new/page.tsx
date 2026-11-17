import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand">
          <ChevronLeft className="h-3.5 w-3.5" /> Products
        </Link>
        <h1 className="display mt-2 text-3xl font-semibold">Add a product</h1>
        <p className="mt-1 text-sm text-muted">Create a new product and publish it to the storefront.</p>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Create a category first before adding products. <Link href="/admin/categories" className="font-semibold underline">Go to categories</Link>.
        </div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
