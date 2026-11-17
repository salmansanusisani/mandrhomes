export type BrandCategory = {
  name: string;
  slug: string;
  children: string[];
};

export const brandCategories: BrandCategory[] = [
  { name: "Plants", slug: "plants", children: ["Artificial", "Live"] },
  { name: "Planters", slug: "planters", children: ["Plastic", "Fibre Glass", "Fibre Stone", "Wood", "Metal"] },
  { name: "Vases", slug: "vases", children: ["Ceramic", "Plastic", "Glass"] },
  { name: "Flowers", slug: "flowers", children: ["Artificial", "Live"] },
  { name: "Stones", slug: "stones", children: ["Pebbles", "Crystal Stones", "Regular Stones"] },
  {
    name: "Decor",
    slug: "decor",
    children: ["Clocks", "Cushions", "Throws", "Mirror", "Photo Frame", "Wall Art", "Faux Books", "Artifacts", "Diffuser", "Candle"],
  },
  { name: "Rugs", slug: "rugs", children: ["Persian/Iranian Rugs", "Turkish Rugs", "Wall-to-Wall", "Drying Mat"] },
  {
    name: "Furniture",
    slug: "furniture",
    children: ["Tables", "Sofa Set", "Bed Set", "Dining Set", "Ottoman & Storage", "Shelf"],
  },
];

export function getBrandCategory(slug: string | undefined | null) {
  return brandCategories.find((category) => category.slug === slug);
}
