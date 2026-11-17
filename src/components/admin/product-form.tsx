"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { saveProductAction } from "@/app/actions/admin";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  brand: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : "Save product"}
    </button>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="input" {...props} />
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const [state, action] = useActionState(saveProductAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      {state?.message && !state.ok && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
      {state?.ok && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Product name" name="name" defaultValue={product?.name} error={errors.name} required placeholder="Aurora Wireless Headphones" />
          </div>
          <Field label="Slug (optional)" name="slug" defaultValue={product?.slug} error={errors.slug} placeholder="auto-generated from name" hint="Used in the product URL." />
          <Field label="SKU" name="sku" defaultValue={product?.sku} error={errors.sku} placeholder="Auto-generated if blank" />
          <div>
            <label htmlFor="categoryId" className="label">Category</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="input" required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-rose-600">{errors.categoryId}</p>}
          </div>
          <Field label="Brand" name="brand" defaultValue={product?.brand} error={errors.brand} placeholder="Aurora" />
          <div className="sm:col-span-2">
            <Field label="Short description" name="shortDescription" defaultValue={product?.shortDescription} error={errors.shortDescription} required placeholder="One clear sentence shown in listings." maxLength={240} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="label">Full description</label>
            <textarea id="description" name="description" rows={8} defaultValue={product?.description} className="input resize-y" required placeholder="Describe the product, materials, what's in the box…" />
            {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Pricing &amp; stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price (₦)" name="price" type="number" step="0.01" min="0" defaultValue={product ? String(product.price / 100) : ""} error={errors.price} required />
          <Field label="Compare-at price (₦)" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={product?.compareAtPrice != null ? String(product.compareAtPrice / 100) : ""} error={errors.compareAtPrice} placeholder="Optional" />
          <Field label="Stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} error={errors.stock} required />
          <Field label="Low stock threshold" name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 5} error={errors.lowStockThreshold} />
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Media &amp; tags</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="images" className="label">Image URLs</label>
            <textarea id="images" name="images" rows={4} defaultValue={product?.images.join("\n")} className="input resize-y font-mono text-xs" placeholder={"https://images.example.com/photo-1.jpg\nhttps://images.example.com/photo-2.jpg"} />
            <p className="mt-1 text-[11px] text-muted">One URL per line, up to 8. The first image is the main image.</p>
            {errors.images && <p className="mt-1 text-xs text-rose-600">{errors.images}</p>}
          </div>
          <Field label="Tags" name="tags" defaultValue={product?.tags.join(", ")} error={errors.tags} placeholder="plants, artificial, fibre stone" hint="Comma separated, up to 12." />
        </div>
      </section>

      <section className="rounded-2xl border border-sand bg-white p-5">
        <h2 className="text-sm font-semibold">Visibility</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="h-4 w-4 accent-brand" />
            Active — visible in the store
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} className="h-4 w-4 accent-brand" />
            Featured on the homepage
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Submit />
        <Link href="/admin/products" className="btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
