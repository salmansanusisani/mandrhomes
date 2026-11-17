import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, Filter, Pencil, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatMoney, formatNumber } from "@/lib/utils";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteProductAction, toggleProductActiveAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 15;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "all";
  const categoryId = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const deleted = sp.deleted === "1";
  const settings = await getSettings();

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(status === "out" ? { stock: 0 } : {}),
    ...(status === "low" ? { stock: { gt: 0, lte: settings.lowStockThreshold }, isActive: true } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const queryFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    if (categoryId) params.set("category", categoryId);
    if (nextPage > 1) params.set("page", String(nextPage));
    const value = params.toString();
    return value ? `/admin/products?${value}` : "/admin/products";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Catalog</p>
          <h1 className="display mt-1 text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-muted">{formatNumber(total)} product{total === 1 ? "" : "s"} in the catalog.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> Add product</Link>
      </div>

      {deleted && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">Product deleted.</div>}

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-2xl border border-sand bg-white p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search by name, SKU or brand…" className="input pl-9" />
        </div>
        <select name="status" defaultValue={status} className="input w-auto min-w-[140px]">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select name="category" defaultValue={categoryId} className="input w-auto min-w-[150px]">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-outline btn-sm"><Filter className="h-3.5 w-3.5" /> Filter</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="overflow-x-auto">
          <table className="table-admin min-w-[860px]">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-sand/20">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                        {product.images[0] ? (
                          <Image src={product.images[0].url} alt={product.name} fill sizes="44px" className="object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-[9px] text-muted">No image</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${product.id}`} className="line-clamp-1 font-semibold hover:text-brand">{product.name}</Link>
                        <p className="text-[11px] text-muted">{product.sku}{product.brand ? ` · ${product.brand}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-muted">{product.category.name}</td>
                  <td className="font-semibold">{formatMoney(product.price, settings.currency)}</td>
                  <td>
                    <span className={`text-sm font-semibold ${product.stock === 0 ? "text-rose-600" : product.stock <= product.lowStockThreshold ? "text-amber-600" : ""}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${product.slug}`} target="_blank" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-sand" aria-label="View product">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/products/${product.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-sand" aria-label="Edit product">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="rounded-lg px-2 py-1 text-[11px] font-semibold text-muted hover:bg-sand">
                          {product.isActive ? "Hide" : "Show"}
                        </button>
                      </form>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmButton label="Delete" message={`Delete ${product.name}? This cannot be undone.`} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="py-14 text-center text-sm text-muted">No products match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={queryFor(page - 1)} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={queryFor(page + 1)} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
