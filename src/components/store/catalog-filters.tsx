import Link from "next/link";
import { prisma } from "@/lib/db";

type FilterCategory = { name: string; slug: string; description: string | null; count: number };

export async function loadFilterCategories(): Promise<FilterCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    count: category._count.products,
  }));
}

export function CatalogFilters({
  categories,
  params,
  prefix,
}: {
  categories: FilterCategory[];
  params: { q?: string; category?: string; tag?: string; min?: string; max?: string; stock?: string; sort?: string };
  prefix: string;
}) {
  const hasFilters = Boolean(params.category || params.tag || params.min || params.max || params.stock);

  return (
    <form action="/products" method="get" className="space-y-6">
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.tag && <input type="hidden" name="tag" value={params.tag} />}
      {params.sort && <input type="hidden" name="sort" value={params.sort} />}

      <fieldset>
        <legend className="label">Category</legend>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-sand/60">
            <span className="flex items-center gap-2.5">
              <input type="radio" name="category" value="" defaultChecked={!params.category} className="accent-brand" />
              All products
            </span>
          </label>
          {categories.map((category) => (
            <label key={category.slug} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-sand/60">
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  defaultChecked={params.category === category.slug}
                  className="accent-brand"
                />
                {category.name}
              </span>
              <span className="text-[11px] text-muted">{category.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Price (₦)</legend>
        <div className="flex items-center gap-2">
          <input
            id={`${prefix}-min`}
            name="min"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            defaultValue={params.min}
            className="input py-2 text-xs"
            aria-label="Minimum price"
          />
          <span className="text-muted">–</span>
          <input
            id={`${prefix}-max`}
            name="max"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            defaultValue={params.max}
            className="input py-2 text-xs"
            aria-label="Maximum price"
          />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" name="stock" value="1" defaultChecked={params.stock === "1"} className="h-4 w-4 accent-brand" />
        In stock only
      </label>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" className="btn-primary btn-sm flex-1">
          Apply filters
        </button>
        {hasFilters && (
          <Link href={params.q ? `/products?q=${encodeURIComponent(params.q)}` : "/products"} className="btn-ghost btn-sm">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
