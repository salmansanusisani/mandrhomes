"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <SlidersHorizontal className="h-4 w-4" />
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          if (event.target.value === "featured") params.delete("sort");
          else params.set("sort", event.target.value);
          params.delete("page");
          const query = params.toString();
          router.push(query ? `/products?${query}` : "/products");
        }}
        className="cursor-pointer rounded-full border border-sand-strong bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-brand"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="name-asc">Name: A to Z</option>
      </select>
    </label>
  );
}
