import type { Metadata } from "next";
import { AlertCircle, Package, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteCategoryAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Catalog</p>
        <h1 className="display mt-1 text-3xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-muted">Organise products into collections shown in the storefront navigation.</p>
      </div>

      {sp.error === "has_products" && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4" /> Move or delete the products in that category first.
        </div>
      )}
      {sp.deleted === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">Category deleted.</div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-sand bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{category.name}</h2>
                    <span className="badge bg-sand text-muted">{category._count.products} products</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">/{category.slug} · sort {category.sortOrder}</p>
                  {category.description && <p className="mt-2 max-w-xl text-xs text-muted">{category.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {category._count.products > 0 ? (
                    <span className="text-[11px] text-muted">In use</span>
                  ) : (
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmButton
                        label="Delete"
                        message={`Delete ${category.name}?`}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                      />
                    </form>
                  )}
                </div>
              </div>
              <details className="group mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-brand hover:underline">Edit category</summary>
                <div className="mt-4 border-t border-sand pt-4">
                  <CategoryForm category={category} />
                </div>
              </details>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand bg-white py-14 text-center">
              <Package className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-2 text-sm text-muted">No categories yet.</p>
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-sand bg-white p-5 xl:sticky xl:top-8">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold">Add category</h2>
          </div>
          <div className="mt-4">
            <CategoryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
