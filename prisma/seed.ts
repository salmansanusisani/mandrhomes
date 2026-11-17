import { PrismaClient, OrderStatus, PaymentStatus, ReviewStatus, CartStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

const n = (naira: number) => Math.round(naira * 100);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

const categories = [
  {
    name: "Plants",
    slug: "plants",
    description: "Living and preserved greenery chosen for shape, texture and presence.",
    image: "/brand/plant-fiddle-leaf.jpg",
  },
  {
    name: "Planters",
    slug: "planters",
    description: "Hand-finished vessels in stone, fibreglass, plastic, wood and metal.",
    image: "/brand/planters-charcoal.jpg",
  },
  {
    name: "Vases",
    slug: "vases",
    description: "Sculptural forms in ceramic, glass and plastic for stems and shelves.",
    image: "/brand/vases-glass.jpg",
  },
  {
    name: "Flowers",
    slug: "flowers",
    description: "Lifelike and live arrangements with an easy, natural hand.",
    image: "/brand/flowers-pink.jpg",
  },
  {
    name: "Stones",
    slug: "stones",
    description: "Pebbles, crystal stones and objects that bring quiet texture.",
    image: "/brand/decor-crystal-bowl.jpg",
  },
  {
    name: "Decor",
    slug: "decor",
    description: "Clocks, candlelight, wall art and small artifacts with a story.",
    image: "/brand/decor-gold-leaves.jpg",
  },
  {
    name: "Rugs",
    slug: "rugs",
    description: "Persian, Turkish and modern floor coverings to ground the room.",
    image: "/brand/hero-living.avif",
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Statement seating, tables, mirrors and storage for considered homes.",
    image: "/brand/furniture-sofa.jpg",
  },
];

const products = [
  {
    name: "Faux Fiddle Leaf Fig Tree",
    category: "plants",
    price: n(68500),
    compareAtPrice: n(82000),
    stock: 22,
    featured: true,
    brand: "M&R Botanicals",
    tags: ["Artificial", "Plants", "Fiddle Leaf"],
    shortDescription: "A sculptural faux fig with broad leaves and a natural trunk.",
    description:
      "Our best-selling faux fiddle leaf brings height and softness without the watering can. The broad, lightly glossed leaves are set on a natural-look trunk and arranged to catch light from every angle.\n\nRecommended for living rooms, entryways and corners that need a little life. Comes in a weighted nursery pot; decorative planter sold separately.",
    images: ["/brand/plant-fiddle-leaf.jpg"],
  },
  {
    name: "Areca Palm in Stone Pot",
    category: "plants",
    price: n(54000),
    stock: 18,
    featured: true,
    brand: "M&R Botanicals",
    tags: ["Live", "Plants", "Palm"],
    shortDescription: "A soft, feathery palm ready to style straight out of the box.",
    description:
      "An easy-going areca palm with fine, arching fronds, potted in a textured stone planter. It tolerates bright indirect light and brings instant softness to a bare corner.\n\nDelivered potted and ready to place. Water when the top two inches of soil feel dry.",
    images: ["/brand/plant-areca-palm.jpg"],
  },
  {
    name: "ZZ Plant",
    category: "plants",
    price: n(42500),
    stock: 30,
    featured: false,
    brand: "M&R Botanicals",
    tags: ["Live", "Plants"],
    shortDescription: "Glossy, architectural leaves and famously forgiving care.",
    description:
      "The ZZ plant is the quiet overachiever of the houseplant world: deep green, waxy leaves and a tolerance for lower light. It looks particularly good in a simple ceramic or concrete pot.\n\nLow maintenance. Allow the soil to dry out between waterings.",
    images: ["/brand/plant-zz.jpg"],
  },
  {
    name: "Snake Plant",
    category: "plants",
    price: n(38500),
    stock: 26,
    featured: false,
    brand: "M&R Botanicals",
    tags: ["Live", "Plants"],
    shortDescription: "Upright, sculptural leaves that suit almost any room.",
    description:
      "A clean, architectural snake plant with tall, variegated leaves. It is tolerant of low light and irregular watering, making it a generous gift for a first home.\n\nPot size may vary slightly. Plant arrives in a nursery pot ready for repotting.",
    images: ["/brand/plant-snake.jpg"],
  },
  {
    name: "Preserved Olive Tree",
    category: "plants",
    price: n(128000),
    compareAtPrice: n(145000),
    stock: 8,
    featured: true,
    brand: "M&R Botanicals",
    tags: ["Artificial", "Plants", "Olive"],
    shortDescription: "A soft, silver-green tree with the quiet presence of the real thing.",
    description:
      "A carefully shaped preserved olive tree with delicate silver-green leaves and a natural branching trunk. It brings Mediterranean calm to a bright corner without any of the upkeep.\n\nRecommended indoors, away from direct heat. Decorative pot shown is not included.",
    images: ["/brand/plant-tree.jpg"],
  },
  {
    name: "Mini Potted Fern",
    category: "plants",
    price: n(22500),
    stock: 40,
    featured: false,
    brand: "M&R Botanicals",
    tags: ["Artificial", "Plants"],
    shortDescription: "A small, textural fern for desks, shelves and bathrooms.",
    description:
      "A compact preserved fern with finely cut fronds and a natural droop. It is just the thing for a bedside table, a kitchen shelf or a window that needs a little softness.\n\nWipe gently with a dry cloth to keep the leaves dust-free.",
    images: ["/brand/plant-white-pot.jpg"],
  },
  {
    name: "Ribbed Charcoal Planter",
    category: "planters",
    price: n(46500),
    stock: 20,
    featured: true,
    brand: "M&R Stoneworks",
    tags: ["Fibre Stone", "Planters", "Ribbed"],
    shortDescription: "A generous, ribbed planter with a soft matte graphite finish.",
    description:
      "A substantial planter with a fine vertical rib and a matte charcoal finish. The composite stone is lighter than it looks, making it easy to move when you feel like a change.\n\nFits a 20cm nursery pot. Suitable for indoor and covered outdoor use.",
    images: ["/brand/planters-charcoal.jpg"],
  },
  {
    name: "Gold Fibreglass Planter",
    category: "planters",
    price: n(58500),
    stock: 16,
    featured: false,
    brand: "M&R Stoneworks",
    tags: ["Fibre Glass", "Planters", "Gold"],
    shortDescription: "A warm metallic planter that lifts a quiet corner.",
    description:
      "A rounded fibreglass planter with a brushed gold finish, made for ferns, palms and leafy statement plants. The warm metallic surface pairs particularly well with deep greens and dark timber.\n\nFits a 22cm nursery pot. Lightweight and wipe-clean.",
    images: ["/brand/planter-gold.jpg"],
  },
  {
    name: "Concrete Pedestal Planter",
    category: "planters",
    price: n(72000),
    stock: 10,
    featured: false,
    brand: "M&R Stoneworks",
    tags: ["Fibre Stone", "Planters", "Concrete"],
    shortDescription: "A tall, architectural pedestal with a raw stone texture.",
    description:
      "Raise a favourite plant to eye level with this pedestal planter in a soft concrete finish. The clean cylinder and subtle texture make it work equally well in a modern or more layered room.\n\nFits a 24cm nursery pot. Indoor use recommended.",
    images: ["/brand/planter-concrete.jpg"],
  },
  {
    name: "Tall White Planter",
    category: "planters",
    price: n(49500),
    stock: 14,
    featured: false,
    brand: "M&R Stoneworks",
    tags: ["Plastic", "Planters", "White"],
    shortDescription: "A quiet, floor-standing planter in a chalky white finish.",
    description:
      "A simple tall planter with a soft chalk-white finish and a gently tapered profile. The lightweight plastic construction makes it easy to move, while the matte surface keeps it looking considered.\n\nFits a 26cm nursery pot. Indoor use.",
    images: ["/brand/planter-white-tall.jpg"],
  },
  {
    name: "Round White Planter",
    category: "planters",
    price: n(34500),
    stock: 32,
    featured: false,
    brand: "M&R Stoneworks",
    tags: ["Plastic", "Planters", "White"],
    shortDescription: "A clean, rounded planter for smaller plants and herbs.",
    description:
      "A versatile round planter with a clean silhouette and a soft white finish. It suits herbs in the kitchen, a fern in the bathroom or a small olive on a console.\n\nFits a 16cm nursery pot. Wipe clean with a damp cloth.",
    images: ["/brand/plant-white-planter.png"],
  },
  {
    name: "Amber Glass Vase Trio",
    category: "vases",
    price: n(36500),
    stock: 24,
    featured: true,
    brand: "M&R Glasshouse",
    tags: ["Glass", "Vases", "Amber"],
    shortDescription: "Three warm amber vases designed to be styled together.",
    description:
      "A trio of glass vases in graduated heights and warm amber tones. Use them as a single arrangement, or split them across shelves for a quieter, collected effect.\n\nSet of three. Hand wash with care. Flowers not included.",
    images: ["/brand/vases-glass.jpg"],
  },
  {
    name: "Blush Ceramic Vase",
    category: "vases",
    price: n(28500),
    stock: 28,
    featured: false,
    brand: "M&R Ceramics",
    tags: ["Ceramic", "Vases", "Blush"],
    shortDescription: "A softly rounded ceramic vase with a chalky blush glaze.",
    description:
      "A small but generous ceramic vase with a rounded body and a narrow neck. The chalky blush glaze works beautifully with dried stems, single branches or no flowers at all.\n\nHand-finished, so subtle variation in glaze is expected. Wipe clean only.",
    images: ["/brand/vase-pink-flowers.jpg"],
  },
  {
    name: "Sculptural Vase Set",
    category: "vases",
    price: n(52000),
    stock: 12,
    featured: false,
    brand: "M&R Ceramics",
    tags: ["Ceramic", "Vases", "Sculptural"],
    shortDescription: "Two irregular ceramic forms with a soft stone finish.",
    description:
      "A pair of sculptural vases with irregular silhouettes and a soft, stone-like finish. They look as good empty on a shelf as they do holding a few considered stems.\n\nSet of two. Each piece is hand-finished and therefore unique.",
    images: ["/brand/vases-shelf.jpg"],
  },
  {
    name: "Blush Peony Arrangement",
    category: "flowers",
    price: n(44500),
    stock: 25,
    featured: true,
    brand: "M&R Botanicals",
    tags: ["Artificial", "Flowers", "Peony"],
    shortDescription: "Full, soft peonies in a palette of warm blush and cream.",
    description:
      "A generous arrangement of faux peonies with layered, softly ruffled blooms. The stems are wired for shaping, so you can open the arrangement up or keep it compact.\n\nNo watering required. Trim stems with wire cutters if needed. Vase not included.",
    images: ["/brand/flowers-pink.jpg"],
  },
  {
    name: "White Orchid Centerpiece",
    category: "flowers",
    price: n(57500),
    stock: 15,
    featured: false,
    brand: "M&R Botanicals",
    tags: ["Artificial", "Flowers", "Orchid"],
    shortDescription: "A refined white orchid for dining tables and consoles.",
    description:
      "A lifelike white orchid with delicate petals and gently arching stems. It brings a formal but easy elegance to a dining table, entry console or bedside.\n\nIndoor use. Keep away from direct sunlight and wipe leaves with a soft dry cloth.",
    images: ["/brand/flowers-white.jpg"],
  },
  {
    name: "Crystal Decorative Bowl",
    category: "stones",
    price: n(41500),
    stock: 18,
    featured: false,
    brand: "M&R Objects",
    tags: ["Crystal Stones", "Stones", "Crystal"],
    shortDescription: "A faceted crystal bowl that catches and scatters light.",
    description:
      "A decorative crystal bowl with a faceted edge and a warm, honeyed sparkle. Fill it with small treasures, use it as a centrepiece, or simply let it catch the afternoon light.\n\nHand wash only. Each bowl has its own natural variation.",
    images: ["/brand/decor-crystal-bowl.jpg"],
  },
  {
    name: "Sculptural Stone Object",
    category: "stones",
    price: n(24500),
    stock: 20,
    featured: false,
    brand: "M&R Objects",
    tags: ["Regular Stones", "Stones", "Sculptural"],
    shortDescription: "A small, tactile stone form for shelves and tables.",
    description:
      "A quiet little object in a warm grey stone finish, with a soft cone silhouette that invites touch. It is the kind of piece that finishes a shelf without demanding attention.\n\nIndoor use. Wipe clean with a dry cloth.",
    images: ["/brand/decor-grey-cone.jpg"],
  },
  {
    name: "Gold Leaf Artifact",
    category: "decor",
    price: n(32500),
    stock: 17,
    featured: true,
    brand: "M&R Objects",
    tags: ["Artifacts", "Decor", "Gold"],
    shortDescription: "A burnished gold leaf sculpture on a simple stand.",
    description:
      "A sculptural gold leaf, hand-finished and mounted on a slim stand. It brings a little warmth and movement to a console, bookshelf or desk.\n\nIndoor use. Dust gently with a soft brush or dry cloth.",
    images: ["/brand/decor-gold-leaves.jpg"],
  },
  {
    name: "Vintage Car Sculpture",
    category: "decor",
    price: n(27500),
    stock: 21,
    featured: false,
    brand: "M&R Objects",
    tags: ["Artifacts", "Decor", "Vintage"],
    shortDescription: "A small, nostalgic car sculpture in an aged gold finish.",
    description:
      "A decorative vintage car with a lightly aged gold finish. It makes a characterful gift and a nice small-scale contrast on a shelf of books and ceramics.\n\nIndoor use. Wipe clean with a dry cloth.",
    images: ["/brand/decor-gold-car.jpg"],
  },
  {
    name: "Brass Candlestick Pair",
    category: "decor",
    price: n(38500),
    stock: 19,
    featured: false,
    brand: "M&R Objects",
    tags: ["Candle", "Decor", "Brass"],
    shortDescription: "Two slim brass candlesticks with a warm, lived-in finish.",
    description:
      "A pair of slim brass candlesticks with a softly aged finish. Use them together on a dining table or split them between a mantel and a bedside.\n\nFits standard taper candles. Brass will develop a natural patina over time.",
    images: ["/brand/decor-candlesticks.jpg"],
  },
  {
    name: "Gold Candle Holder",
    category: "decor",
    price: n(21500),
    stock: 35,
    featured: false,
    brand: "M&R Objects",
    tags: ["Candle", "Decor", "Gold"],
    shortDescription: "A small gold holder for taper candles and quiet evenings.",
    description:
      "A compact gold candle holder with a clean, rounded base. It is made for a single taper candle and looks best in pairs, or scattered along a long table.\n\nFits standard taper candles. Wipe clean only.",
    images: ["/brand/decor-gold-candle-holder.jpg"],
  },
  {
    name: "Silver Spiral Sculpture",
    category: "decor",
    price: n(29500),
    stock: 13,
    featured: false,
    brand: "M&R Objects",
    tags: ["Artifacts", "Decor", "Silver"],
    shortDescription: "A fluid silver spiral that adds movement to a still surface.",
    description:
      "A small abstract sculpture in a bright silver finish, formed as an open spiral. It catches the light from different angles and brings a contemporary note to a traditional shelf.\n\nIndoor use. Dust with a soft dry cloth.",
    images: ["/brand/decor-silver-spiral.jpg"],
  },
  {
    name: "Gold Wire Abstract",
    category: "decor",
    price: n(26500),
    stock: 16,
    featured: false,
    brand: "M&R Objects",
    tags: ["Artifacts", "Decor", "Gold"],
    shortDescription: "An airy gold wire object with a light, graphic line.",
    description:
      "A light and graphic decorative object made from a continuous line of gold wire. It works particularly well in front of books or a plain wall, where its negative space can breathe.\n\nIndoor use. Handle with care and dust gently.",
    images: ["/brand/decor-gold-wire.jpg"],
  },
  {
    name: "Big Ben Desk Clock",
    category: "decor",
    price: n(48500),
    compareAtPrice: n(56000),
    stock: 9,
    featured: true,
    brand: "M&R Objects",
    tags: ["Clocks", "Decor", "Desk"],
    shortDescription: "A stately desk clock inspired by the London landmark.",
    description:
      "A decorative desk clock with a warm metallic finish and a classic clock face. It brings a sense of occasion to a study, console or bedside table.\n\nQuartz movement. Requires one AA battery (not included).",
    images: ["/brand/decor-bigben-clock.jpg"],
  },
  {
    name: "Motorcycle Table Clock",
    category: "decor",
    price: n(36500),
    stock: 11,
    featured: false,
    brand: "M&R Objects",
    tags: ["Clocks", "Decor", "Vintage"],
    shortDescription: "A small motorcycle clock with a playful, vintage spirit.",
    description:
      "A table clock built around a miniature motorcycle silhouette. It is a good gift for the person who has everything, and a nice small surprise on a desk or shelf.\n\nQuartz movement. Requires one AA battery (not included).",
    images: ["/brand/decor-motorcycle-clock.jpg"],
  },
  {
    name: "Gallery Wall Frame Set",
    category: "decor",
    price: n(64500),
    stock: 7,
    featured: false,
    brand: "M&R Objects",
    tags: ["Wall Art", "Photo Frame", "Decor"],
    shortDescription: "A considered set of frames for an instant gallery wall.",
    description:
      "A curated set of frames in mixed sizes and finishes, designed to be hung together. Use them for family photographs, art prints or a mix of both.\n\nSet includes six frames and a hanging guide. Hardware included.",
    images: ["/brand/hero-gallery.jpg"],
  },
  {
    name: "Persian Medallion Rug",
    category: "rugs",
    price: n(285000),
    compareAtPrice: n(320000),
    stock: 5,
    featured: true,
    brand: "M&R Textiles",
    tags: ["Persian/Iranian Rugs", "Rugs", "Living Room"],
    shortDescription: "A richly patterned medallion rug in deep, warm tones.",
    description:
      "A statement rug with a classic medallion composition and a soft, lived-in palette. The dense pile is comfortable underfoot and adds warmth to a living room or dining space.\n\nProfessional clean recommended. Rug pad sold separately. Sizes may vary slightly.",
    images: ["/brand/hero-living.avif"],
  },
  {
    name: "Modern Wool Rug",
    category: "rugs",
    price: n(195000),
    stock: 6,
    featured: false,
    brand: "M&R Textiles",
    tags: ["Turkish Rugs", "Rugs", "Wool"],
    shortDescription: "A quiet, textured wool rug with a soft neutral ground.",
    description:
      "A modern wool rug with a subtle woven texture and a calm neutral ground. It layers easily with patterned pieces and brings quiet warmth to a bedroom or sitting room.\n\nProfessional clean recommended. Shedding is normal in the first few weeks.",
    images: ["/brand/furniture-mirror.avif"],
  },
  {
    name: "Rosewood Chesterfield Sofa",
    category: "furniture",
    price: n(685000),
    compareAtPrice: n(760000),
    stock: 3,
    featured: true,
    brand: "M&R Furniture",
    tags: ["Sofa Set", "Furniture", "Living Room"],
    shortDescription: "A deep, buttoned sofa with a rich rosewood-toned upholstery.",
    description:
      "A generous Chesterfield-style sofa with deep buttoning, rolled arms and a warm rosewood-toned fabric. The frame is built for everyday sitting, not just looking.\n\nDelivery and assembly included within Abuja. Fabric swatches available on request.",
    images: ["/brand/furniture-sofa.jpg"],
  },
  {
    name: "Walnut Round Dining Table",
    category: "furniture",
    price: n(420000),
    stock: 4,
    featured: true,
    brand: "M&R Furniture",
    tags: ["Tables", "Furniture", "Dining Set"],
    shortDescription: "A round walnut table with a warm, sculptural base.",
    description:
      "A round dining table in a warm walnut finish, with a softly tapered pedestal base. It seats four comfortably and makes a small dining room feel more generous.\n\nDelivery and assembly included within Abuja. Chairs sold separately.",
    images: ["/brand/furniture-walnut-table.jpg"],
  },
  {
    name: "Sculpted Side Table",
    category: "furniture",
    price: n(165000),
    stock: 9,
    featured: false,
    brand: "M&R Furniture",
    tags: ["Tables", "Furniture", "Side Table"],
    shortDescription: "A small, sculptural table with a soft stone-like finish.",
    description:
      "A compact side table with a rounded top and a sculpted base. It works beside a sofa, as a bedside table or as a small drinks table when friends come over.\n\nIndoor use. Wipe clean with a soft damp cloth.",
    images: ["/brand/furniture-round-table.png"],
  },
  {
    name: "Arched Floor Mirror",
    category: "furniture",
    price: n(135000),
    stock: 7,
    featured: false,
    brand: "M&R Furniture",
    tags: ["Mirror", "Furniture", "Arched"],
    shortDescription: "A tall arched mirror that makes a room feel twice as open.",
    description:
      "A full-length arched mirror with a slim frame and a clean, modern line. Leaning or wall-mounted, it brings light deeper into a room and gives an instant sense of space.\n\nWall-mounting hardware included. We recommend securing to the wall.",
    images: ["/brand/furniture-mirror.avif"],
  },
];

const reviews = [
  { product: "faux-fiddle-leaf-fig-tree", rating: 5, title: "Looks real", body: "Guests always ask if it is real. The leaves are beautifully shaped and it fills the corner without feeling heavy." },
  { product: "faux-fiddle-leaf-fig-tree", rating: 4, title: "Great presence", body: "A lovely shape and a good height. I only wish the pot were included, but styling it was half the fun." },
  { product: "areca-palm-in-stone-pot", rating: 5, title: "Arrived beautifully", body: "Packed with care and already looking healthy. It softened the whole living room immediately." },
  { product: "ribbed-charcoal-planter", rating: 5, title: "Beautiful texture", body: "The ribbing catches the light so nicely. It looks much more expensive than it is." },
  { product: "amber-glass-vase-trio", rating: 5, title: "Warm and elegant", body: "The amber glass is gorgeous in the afternoon light. I split the set across two shelves and it works perfectly." },
  { product: "blush-peony-arrangement", rating: 5, title: "So full and soft", body: "The peonies look surprisingly real. I have them on the dining table and have had so many compliments." },
  { product: "gold-leaf-artifact", rating: 4, title: "Lovely little piece", body: "A beautiful small sculpture. It finishes my console table and catches the light beautifully." },
  { product: "persian-medallion-rug", rating: 5, title: "The room feels finished", body: "The colours are rich but restrained. It pulled the whole living room together." },
  { product: "rosewood-chesterfield-sofa", rating: 5, title: "Worth the wait", body: "Delivery was smooth and the sofa is beautifully made. Deep, comfortable and exactly the right colour." },
  { product: "walnut-round-dining-table", rating: 5, title: "Perfect for our space", body: "The round top makes the room feel bigger and the walnut finish is warm without being orange." },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@shopwave.test";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const adminName = process.env.ADMIN_NAME ?? "M&R Homes Admin";

  const [adminHash, customerHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash("Customer123!", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", name: adminName },
    create: { email: adminEmail, passwordHash: adminHash, name: adminName, role: "ADMIN" },
  });

  const amina = await prisma.user.upsert({
    where: { email: "amina@example.com" },
    update: {},
    create: { email: "amina@example.com", passwordHash: customerHash, name: "Amina Bello", phone: "+2348012345678" },
  });

  const tunde = await prisma.user.upsert({
    where: { email: "tunde@example.com" },
    update: {},
    create: { email: "tunde@example.com", passwordHash: customerHash, name: "Tunde Adeyemi", phone: "+2348098765432" },
  });

  await prisma.address.upsert({
    where: { id: "seed-address-amina" },
    update: {
      fullName: "Amina Bello",
      phone: "+2348012345678",
      line1: "18 Ademola Adetokubo Crescent",
      city: "Wuse 2",
      state: "Abuja",
      postalCode: "900288",
      country: "Nigeria",
    },
    create: {
      id: "seed-address-amina",
      userId: amina.id,
      fullName: "Amina Bello",
      phone: "+2348012345678",
      line1: "18 Ademola Adetokubo Crescent",
      city: "Wuse 2",
      state: "Abuja",
      postalCode: "900288",
      country: "Nigeria",
      isDefault: true,
    },
  });

  // This is a demo catalogue, so replace the previous seed cleanly on every run.
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.pageView.deleteMany();

  const categoryMap = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const record = await prisma.category.create({
      data: { ...category, sortOrder: index },
    });
    categoryMap.set(category.slug, record.id);
  }

  const productMap = new Map<string, { id: string; name: string; price: number; image: string }>();
  for (const [index, product] of products.entries()) {
    const slug = slugify(product.name, { lower: true, strict: true });
    const categoryId = categoryMap.get(product.category)!;
    const record = await prisma.product.create({
      data: {
        name: product.name,
        slug,
        sku: `MR-${slug.slice(0, 14).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        stock: product.stock,
        brand: product.brand,
        tags: product.tags,
        isFeatured: product.featured,
        categoryId,
        images: {
          create: product.images.map((url, position) => ({
            url,
            alt: `${product.name} — image ${position + 1}`,
            position,
          })),
        },
      },
    });
    productMap.set(slug, { id: record.id, name: record.name, price: record.price, image: product.images[0] });
  }

  const reviewUsers = [amina, tunde];
  for (const [index, review] of reviews.entries()) {
    const product = productMap.get(review.product);
    if (!product) continue;
    const user = reviewUsers[index % reviewUsers.length];
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: ReviewStatus.APPROVED,
      },
    });
  }

  const address = {
    fullName: "Amina Bello",
    phone: "+2348012345678",
    line1: "18 Ademola Adetokubo Crescent",
    line2: "Wuse 2",
    city: "Abuja",
    state: "FCT",
    postalCode: "900288",
    country: "Nigeria",
  };

  const demoOrders: Array<{
    number: string;
    userId: string | null;
    email: string;
    name: string;
    status: OrderStatus;
    payment: PaymentStatus;
    days: number;
    items: Array<[string, number]>;
  }> = [
    { number: "MR-2605-1001", userId: amina.id, email: "amina@example.com", name: "Amina Bello", status: "DELIVERED", payment: "SUCCESS", days: 26, items: [["faux-fiddle-leaf-fig-tree", 1], ["brass-candlestick-pair", 1]] },
    { number: "MR-2605-1002", userId: tunde.id, email: "tunde@example.com", name: "Tunde Adeyemi", status: "DELIVERED", payment: "SUCCESS", days: 21, items: [["amber-glass-vase-trio", 1]] },
    { number: "MR-2605-1003", userId: amina.id, email: "amina@example.com", name: "Amina Bello", status: "SHIPPED", payment: "SUCCESS", days: 12, items: [["blush-peony-arrangement", 1], ["gold-leaf-artifact", 1]] },
    { number: "MR-2605-1004", userId: null, email: "grace@example.com", name: "Grace Okafor", status: "PROCESSING", payment: "SUCCESS", days: 8, items: [["rosewood-chesterfield-sofa", 1], ["sculpted-side-table", 1]] },
    { number: "MR-2605-1005", userId: tunde.id, email: "tunde@example.com", name: "Tunde Adeyemi", status: "DELIVERED", payment: "SUCCESS", days: 6, items: [["big-ben-desk-clock", 1], ["gold-candle-holder", 2]] },
    { number: "MR-2605-1006", userId: amina.id, email: "amina@example.com", name: "Amina Bello", status: "PAID", payment: "SUCCESS", days: 2, items: [["white-orchid-centerpiece", 1]] },
    { number: "MR-2605-1007", userId: null, email: "grace@example.com", name: "Grace Okafor", status: "PAID", payment: "SUCCESS", days: 1, items: [["gallery-wall-frame-set", 1], ["gold-wire-abstract", 1]] },
    { number: "MR-2605-1008", userId: null, email: "idris@example.com", name: "Idris Musa", status: "PENDING", payment: "PENDING", days: 0.2, items: [["persian-medallion-rug", 1]] },
  ];

  for (const demo of demoOrders) {
    const items = demo.items.map(([slug, quantity]) => {
      const product = productMap.get(slug)!;
      return { productId: product.id, name: product.name, price: product.price, quantity, image: product.image };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= n(250000) ? 0 : n(7500);
    const createdAt = daysAgo(demo.days);
    await prisma.order.create({
      data: {
        number: demo.number,
        userId: demo.userId,
        email: demo.email,
        customerName: demo.name,
        phone: "+2348012345678",
        status: demo.status,
        paymentStatus: demo.payment,
        paymentReference: demo.payment === "SUCCESS" ? `seed-ref-${demo.number}` : null,
        subtotal,
        shipping,
        tax: 0,
        total: subtotal + shipping,
        currency: "NGN",
        shippingAddress: { ...address, fullName: demo.name },
        billingAddress: { ...address, fullName: demo.name },
        paidAt: demo.payment === "SUCCESS" ? createdAt : null,
        createdAt,
        items: { create: items },
        events: {
          create: [
            { message: "Order created", createdAt },
            ...(demo.payment === "SUCCESS" ? [{ message: "Payment confirmed", createdAt }] : []),
            ...(demo.status === "SHIPPED" || demo.status === "DELIVERED"
              ? [{ message: "Order shipped", createdAt: daysAgo(Math.max(demo.days - 4, 0)) }]
              : []),
            ...(demo.status === "DELIVERED" ? [{ message: "Order delivered", createdAt: daysAgo(Math.max(demo.days - 6, 0)) }] : []),
          ],
        },
      },
    });
  }

  const fig = productMap.get("faux-fiddle-leaf-fig-tree")!;
  const peonies = productMap.get("blush-peony-arrangement")!;
  const cart = await prisma.cart.create({
    data: {
      token: "seed-abandoned-cart-token",
      recoveryToken: "seed-abandoned-recovery-token",
      email: "grace@example.com",
      status: CartStatus.ACTIVE,
      items: {
        create: [
          { productId: fig.id, quantity: 1 },
          { productId: peonies.id, quantity: 1 },
        ],
      },
    },
  });
  await prisma.$executeRaw`UPDATE "Cart" SET "updatedAt" = ${hoursAgo(30)} WHERE "id" = ${cart.id}`;

  const paths = [
    "/", "/products", "/products?category=plants", "/products?category=decor",
    "/products?category=furniture", "/products?category=rugs", "/products/faux-fiddle-leaf-fig-tree",
    "/products/rosewood-chesterfield-sofa", "/products/amber-glass-vase-trio", "/cart", "/checkout",
    "/products?sort=newest", "/products?category=planters",
  ];
  const referrers = [null, null, null, "https://google.com", "https://instagram.com", "https://tiktok.com", "https://facebook.com"];
  const rows: Array<{ path: string; referrer: string | null; sessionId: string; userAgent: string; createdAt: Date }> = [];
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let day = 29; day >= 0; day--) {
    const base = 38 + Math.floor(random() * 55) + (29 - day) * 2;
    for (let i = 0; i < base; i++) {
      const path = paths[Math.floor(random() * paths.length)];
      rows.push({
        path,
        referrer: referrers[Math.floor(random() * referrers.length)],
        sessionId: `seed-session-${day}-${Math.floor(random() * 180)}`,
        userAgent: "Mozilla/5.0 (seed)",
        createdAt: new Date(daysAgo(day).getTime() + Math.floor(random() * 20) * 60 * 60 * 1000),
      });
    }
  }
  await prisma.pageView.createMany({ data: rows });

  const settings: Record<string, unknown> = {
    storeName: "M&R Homes",
    tagline: "Curated plants, planters and objects for considered living.",
    announcement: "Complimentary delivery in Abuja on orders over ₦250,000",
    currency: "NGN",
    shippingFlat: n(7500),
    freeShippingThreshold: n(250000),
    taxRate: 0,
    supportEmail: process.env.SUPPORT_EMAIL ?? "hello@mrhomes.ng",
    supportPhone: "+234 803 000 0000",
    address: "Shop A206, Stick and Stones (Carter) Plaza, Ademola Adetokubo Crescent, Wuse 2, Abuja",
    instagram: "https://instagram.com/mandrhomes",
    tiktok: "https://tiktok.com/@mandrhomes",
    facebook: "https://facebook.com/mandrhomes",
    youtube: "https://youtube.com/@mandrhomes",
    x: "",
    lowStockThreshold: 10,
    abandonedCartHours: 6,
    abandonedCartMaxReminders: 3,
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never } });
  }

  console.log("Seed complete.");
  console.log(`Admin: ${admin.email} / ${adminPassword}`);
  console.log("Customers: amina@example.com, tunde@example.com / Customer123!");
  console.log(`Products: ${products.length}`);
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
