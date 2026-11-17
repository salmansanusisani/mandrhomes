"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { saveCategoryAction } from "@/app/actions/admin";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary btn-sm" disabled={pending}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}

export function CategoryForm({
  category,
}: {
  category?: { id: string; name: string; slug: string; description: string | null; image: string | null; sortOrder: number };
}) {
  const [state, action] = useActionState(saveCategoryAction, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-3">
      {category?.id && <input type="hidden" name="id" value={category.id} />}
      {state?.message && (
        <p className={`rounded-lg px-3 py-2 text-xs ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          {state.message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`cat-name-${category?.id ?? "new"}`}>Name</label>
          <input id={`cat-name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} className="input" required />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor={`cat-slug-${category?.id ?? "new"}`}>Slug</label>
          <input id={`cat-slug-${category?.id ?? "new"}`} name="slug" defaultValue={category?.slug} className="input" placeholder="auto from name" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`cat-desc-${category?.id ?? "new"}`}>Description</label>
          <input id={`cat-desc-${category?.id ?? "new"}`} name="description" defaultValue={category?.description ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`cat-image-${category?.id ?? "new"}`}>Image URL</label>
          <input id={`cat-image-${category?.id ?? "new"}`} name="image" defaultValue={category?.image ?? ""} className="input" placeholder="https://…" />
        </div>
        <div>
          <label className="label" htmlFor={`cat-sort-${category?.id ?? "new"}`}>Sort order</label>
          <input id={`cat-sort-${category?.id ?? "new"}`} name="sortOrder" type="number" min="0" defaultValue={category?.sortOrder ?? 0} className="input" />
        </div>
      </div>
      <Submit label={category?.id ? "Save changes" : "Add category"} />
    </form>
  );
}
