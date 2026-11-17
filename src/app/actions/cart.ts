"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCart, getOrCreateCart, recoverCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type CartActionResult = { ok: boolean; message: string; count?: number };

async function currentCount(cartId: string) {
  const result = await prisma.cartItem.aggregate({ where: { cartId }, _sum: { quantity: true } });
  return result._sum.quantity ?? 0;
}

function revalidateCartViews() {
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/products");
  revalidatePath("/checkout");
}

export async function addToCart(productId: string, quantity = 1): Promise<CartActionResult> {
  const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return { ok: false, message: "This product is no longer available." };
  if (product.stock < 1) return { ok: false, message: "This product is out of stock." };

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === productId);
  const nextQuantity = Math.min((existing?.quantity ?? 0) + safeQuantity, product.stock, 99);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, productId, quantity: nextQuantity },
  });

  revalidateCartViews();
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Added to cart", count: await currentCount(cart.id) };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartActionResult> {
  const cart = await getCart();
  if (!cart) return { ok: false, message: "Your cart has expired. Please add items again." };
  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: "Item not found in your cart." };

  const nextQuantity = Math.floor(quantity);
  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    revalidateCartViews();
    return { ok: true, message: "Item removed", count: await currentCount(cart.id) };
  }

  const capped = Math.min(nextQuantity, Math.max(item.product.stock, 1), 99);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: capped } });
  revalidateCartViews();
  return { ok: true, message: "Cart updated", count: await currentCount(cart.id) };
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const cart = await getCart();
  if (!cart) return { ok: false, message: "Your cart has expired." };
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidateCartViews();
  return { ok: true, message: "Item removed", count: await currentCount(cart.id) };
}

export async function clearCart(): Promise<CartActionResult> {
  const cart = await getCart();
  if (!cart) return { ok: true, message: "Cart is already empty", count: 0 };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidateCartViews();
  return { ok: true, message: "Cart cleared", count: 0 };
}

export async function recoverCartAction(recoveryToken: string) {
  const cart = await recoverCart(recoveryToken);
  if (!cart) redirect("/cart");
  revalidateCartViews();
  redirect("/cart?recovered=1");
}

export async function toggleWishlist(productId: string) {
  const session = await getSession();
  if (!session) return { ok: false, requiresAuth: true, message: "Sign in to save items", added: false };

  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return { ok: false, message: "Product not found", added: false };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: session.id, productId } });
  }

  revalidatePath("/account/wishlist");
  revalidatePath(`/products/${product.slug}`);
  return {
    ok: true,
    added: !existing,
    message: existing ? "Removed from wishlist" : "Saved to wishlist",
  };
}

export async function removeWishlistItem(productId: string) {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in to manage your wishlist" };
  await prisma.wishlistItem.deleteMany({ where: { userId: session.id, productId } });
  revalidatePath("/account/wishlist");
  return { ok: true, message: "Removed from wishlist" };
}

export async function subscribeToNewsletter(_previous: unknown, formData: FormData) {
  const ip = await getClientIp();
  const limit = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.success) return { ok: false, message: "Too many requests. Please try again in a minute." };

  const { newsletterSchema, fieldErrors } = await import("@/lib/validation");
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address.", errors: fieldErrors(parsed.error) };
  }

  const { email, name } = parsed.data;
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  const session = await getSession();

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { unsubscribedAt: null, ...(name ? { name } : {}), ...(session ? { userId: session.id } : {}) },
    create: { email, name: name || null, userId: session?.id ?? null },
  });

  if (!existing) {
    const { sendNewsletterWelcomeEmail } = await import("@/lib/email");
    await sendNewsletterWelcomeEmail(email).catch(() => undefined);
  }

  try {
    revalidatePath("/admin/emails");
  } catch {
    // ignore revalidation issues outside a request scope
  }
  return { ok: true, message: existing ? "You are already subscribed." : "You are on the list. Check your inbox." };
}
