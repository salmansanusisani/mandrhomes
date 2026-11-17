"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession, getClientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, reviewSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function submitReviewAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Please sign in to leave a review." };

  const ip = await getClientIp();
  const limit = rateLimit(`review:${ip}`, 6, 10 * 60_000);
  if (!limit.success) return { ok: false, message: "Too many reviews submitted. Please try again later." };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: "Please check your review.", errors: fieldErrors(parsed.error) };

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true, slug: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: product.id, userId: session.id } },
  });

  await prisma.review.upsert({
    where: { productId_userId: { productId: product.id, userId: session.id } },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
    },
    create: {
      productId: product.id,
      userId: session.id,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
    },
  });

  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin/reviews");
  return {
    ok: true,
    message: existing
      ? "Your review was updated and is awaiting moderation."
      : "Thanks for your review. It will appear once approved.",
  };
}
