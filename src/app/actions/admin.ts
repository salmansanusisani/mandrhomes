"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { categorySchema, fieldErrors, productSchema, settingsSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { parseLines } from "@/lib/utils";
import { setOrderStatus, markOrderPaid } from "@/lib/orders";
import { sendAbandonedCartReminders } from "@/lib/abandoned";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { ActionState } from "@/lib/types";

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login?next=%2Fadmin");
  return session;
}

function revalidateStorefront(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || `product-${randomBytes(3).toString("hex")}`;
  let candidate = root;
  let index = 2;
  while (
    await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${root}-${index++}`;
  }
  return candidate;
}

export async function saveProductAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await ensureAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    sku: formData.get("sku") ?? "",
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    brand: formData.get("brand") ?? "",
    tags: formData.get("tags") ?? "",
    images: formData.get("images") ?? "",
    isActive: formData.get("isActive"),
    isFeatured: formData.get("isFeatured"),
  });

  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { ok: false, message: "Choose a valid category.", errors: { categoryId: "Invalid category" } };

  const slug = await uniqueSlug(data.slug || data.name, data.id);
  const images = parseLines(data.images).filter((url) => /^https?:\/\//.test(url) || url.startsWith("/")).slice(0, 8);
  const tags = data.tags
    ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
    : [];

  let sku = data.sku?.trim() ?? "";
  if (!sku) {
    sku = `SW-${slug.slice(0, 10).toUpperCase().replace(/-/g, "")}-${randomBytes(2).toString("hex").toUpperCase()}`;
  }
  const skuConflict = await prisma.product.findFirst({
    where: { sku, ...(data.id ? { id: { not: data.id } } : {}) },
    select: { id: true },
  });
  if (skuConflict) {
    return { ok: false, message: "That SKU is already in use.", errors: { sku: "SKU already exists" } };
  }

  const scalar = {
    name: data.name,
    slug,
    sku,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription,
    description: data.description,
    price: Math.round(data.price * 100),
    compareAtPrice: data.compareAtPrice != null ? Math.round(data.compareAtPrice * 100) : null,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    brand: data.brand || null,
    tags,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
  };

  let savedProduct: { id: string; slug: string } | null = null;

  try {
    savedProduct = await prisma.$transaction(async (tx) => {
      const saved = data.id
        ? await tx.product.update({ where: { id: data.id }, data: scalar })
        : await tx.product.create({ data: scalar });
      await tx.productImage.deleteMany({ where: { productId: saved.id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, position) => ({ productId: saved.id, url, alt: data.name, position })),
        });
      }
      return { id: saved.id, slug: saved.slug };
    });

    revalidateStorefront(savedProduct.slug);
    revalidatePath(`/admin/products/${savedProduct.id}`);
  } catch (error) {
    console.error("[admin] save product failed", error);
    return { ok: false, message: "Could not save the product. Please try again." };
  }

  redirect(`/admin/products/${savedProduct.id}?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const product = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  await prisma.product.delete({ where: { id } });
  revalidateStorefront(product?.slug);
  redirect("/admin/products?deleted=1");
}

export async function toggleProductActiveAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true, slug: true } });
  if (!product) return;
  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  revalidateStorefront(product.slug);
  revalidatePath("/admin/products");
}

export async function saveCategoryAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await ensureAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    image: formData.get("image") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, message: "Please check the form.", errors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);
  const conflict = await prisma.category.findFirst({
    where: { slug, ...(data.id ? { id: { not: data.id } } : {}) },
    select: { id: true },
  });
  if (conflict) return { ok: false, message: "A category with that slug already exists." };

  if (data.id) {
    await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        sortOrder: data.sortOrder,
      },
    });
  } else {
    await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        sortOrder: data.sortOrder,
      },
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products?category=${slug}`);
  return { ok: true, message: data.id ? "Category updated." : "Category created." };
}

export async function deleteCategoryAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) redirect("/admin/categories?error=has_products");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/categories?deleted=1");
}

const orderStatusSchema = z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]);

export async function updateOrderStatusAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = orderStatusSchema.safeParse(formData.get("status"));
  if (!id || !parsed.success) return;
  await setOrderStatus(id, parsed.data as OrderStatus);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");
}

export async function markOrderPaidManuallyAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.paymentStatus === "SUCCESS") return;

  let reference = order.paymentReference;
  if (!reference) {
    reference = `MANUAL-${randomBytes(6).toString("hex").toUpperCase()}`;
    await prisma.order.update({ where: { id }, data: { paymentReference: reference } });
  }
  await markOrderPaid(reference, { amountMinor: null });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function resendOrderConfirmationAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return;
  await sendOrderConfirmationEmail(order);
  revalidatePath("/admin/emails");
}

async function setReviewStatus(formData: FormData, status: "APPROVED" | "REJECTED") {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const review = await prisma.review.update({
    where: { id },
    data: { status },
    include: { product: { select: { slug: true } } },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.product.slug}`);
  revalidatePath("/");
}

export async function approveReviewAction(formData: FormData) {
  await setReviewStatus(formData, "APPROVED");
}

export async function rejectReviewAction(formData: FormData) {
  await setReviewStatus(formData, "REJECTED");
}

export async function deleteReviewAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const review = await prisma.review.findUnique({ where: { id }, include: { product: { select: { slug: true } } } });
  if (!review) return;
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.product.slug}`);
  revalidatePath("/");
}

export async function sendCartReminderAction(formData: FormData) {
  await ensureAdmin();
  const cartId = String(formData.get("cartId") ?? "");
  if (!cartId) return;
  const result = await sendAbandonedCartReminders({ cartId, force: true });
  revalidatePath("/admin/carts");
  redirect(`/admin/carts?reminded=${result.sent}&failed=${result.failed}`);
}

export async function runAllCartRemindersAction() {
  await ensureAdmin();
  const result = await sendAbandonedCartReminders();
  revalidatePath("/admin/carts");
  redirect(`/admin/carts?reminded=${result.sent}&failed=${result.failed}`);
}

export async function updateSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await ensureAdmin();

  const raw = {
    storeName: formData.get("storeName"),
    tagline: formData.get("tagline"),
    announcement: formData.get("announcement"),
    currency: formData.get("currency"),
    shippingFlat: formData.get("shippingFlat"),
    freeShippingThreshold: formData.get("freeShippingThreshold"),
    taxRate: Number(formData.get("taxRate") ?? 0) / 100,
    supportEmail: formData.get("supportEmail"),
    supportPhone: formData.get("supportPhone"),
    address: formData.get("address"),
    instagram: formData.get("instagram") ?? "",
    tiktok: formData.get("tiktok") ?? "",
    x: formData.get("x") ?? "",
    facebook: formData.get("facebook") ?? "",
    youtube: formData.get("youtube") ?? "",
    lowStockThreshold: formData.get("lowStockThreshold"),
    abandonedCartHours: formData.get("abandonedCartHours"),
    abandonedCartMaxReminders: formData.get("abandonedCartMaxReminders"),
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the settings.", errors: fieldErrors(parsed.error) };

  const values: Record<string, unknown> = {
    ...parsed.data,
    shippingFlat: Math.round(parsed.data.shippingFlat * 100),
    freeShippingThreshold: Math.round(parsed.data.freeShippingThreshold * 100),
  };

  const fields = [
    "storeName",
    "tagline",
    "announcement",
    "currency",
    "shippingFlat",
    "freeShippingThreshold",
    "taxRate",
    "supportEmail",
    "supportPhone",
    "address",
    "instagram",
    "tiktok",
    "x",
    "facebook",
    "youtube",
    "lowStockThreshold",
    "abandonedCartHours",
    "abandonedCartMaxReminders",
  ];

  await prisma.$transaction(
    fields.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: values[key] as never },
        create: { key, value: values[key] as never },
      }),
    ),
  );

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved." };
}
