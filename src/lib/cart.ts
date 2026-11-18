import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSession, type SessionUser } from "./auth";
import type { StoreSettings } from "./settings";
import { shippingForState } from "./shipping";

export const CART_COOKIE = "shopwave_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: { include: { images: true } } } } };
}>;

export type CartSummary = {
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
  qualifiesForFreeShipping: boolean;
  currency: string;
};

export function summarizeCart(
  cart: CartWithItems | null,
  settings: StoreSettings,
  deliveryState?: string | null,
): CartSummary {
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const qualifiesForFreeShipping =
    subtotal > 0 && settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const shipping = shippingForState(deliveryState, subtotal, settings);
  const tax = Math.round(subtotal * settings.taxRate);
  return {
    count,
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    freeShippingRemaining: Math.max(0, settings.freeShippingThreshold - subtotal),
    qualifiesForFreeShipping,
    currency: settings.currency,
  };
}

export const getCart = cache(async (): Promise<CartWithItems | null> => {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findFirst({
    where: { token, status: "ACTIVE" },
    include: {
      items: {
        include: { product: { include: { images: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
});

async function setCartCookie(token: string) {
  const store = await cookies();
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function clearCartCookie() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

export async function getOrCreateCart(): Promise<CartWithItems> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const session = await getSession();

  if (token) {
    const existing = await prisma.cart.findUnique({
      where: { token },
      include: { items: { include: { product: { include: { images: true } } }, orderBy: { createdAt: "asc" } } },
    });
    if (existing && existing.status === "ACTIVE" && (!existing.userId || !session || existing.userId === session.id)) {
      if (session && (!existing.userId || !existing.email)) {
        return prisma.cart.update({
          where: { id: existing.id },
          data: { userId: session.id, email: existing.email ?? session.email },
          include: { items: { include: { product: { include: { images: true } } }, orderBy: { createdAt: "asc" } } },
        });
      }
      return existing;
    }
  }

  const cart = await prisma.cart.create({
    data: {
      token: randomUUID(),
      recoveryToken: randomUUID(),
      userId: session?.id,
      email: session?.email,
    },
    include: { items: { include: { product: { include: { images: true } } } } },
  });
  await setCartCookie(cart.token);
  return cart;
}

export async function adoptCartOnLogin(user: SessionUser) {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;

  let guest: CartWithItems | null = null;
  if (token) {
    guest = await prisma.cart.findUnique({
      where: { token },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    if (guest && guest.userId && guest.userId !== user.id) guest = null;
    if (guest && guest.status !== "ACTIVE") guest = null;
  }

  const existing = await prisma.cart.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { items: { include: { product: { include: { images: true } } } } },
  });

  if (guest && existing && guest.id !== existing.id) {
    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const match = guest!.items.find((guestItem) => guestItem.productId === item.productId);
        if (match) {
          await tx.cartItem.update({
            where: { id: match.id },
            data: { quantity: Math.min(99, match.quantity + item.quantity) },
          });
        } else {
          await tx.cartItem.create({
            data: { cartId: guest!.id, productId: item.productId, quantity: item.quantity },
          });
        }
      }
      await tx.cart.delete({ where: { id: existing.id } });
      await tx.cart.update({ where: { id: guest!.id }, data: { userId: user.id, email: user.email } });
    });
    return;
  }

  if (guest) {
    await prisma.cart.update({ where: { id: guest.id }, data: { userId: user.id, email: user.email } });
    return;
  }

  if (existing) {
    await setCartCookie(existing.token);
    return;
  }

  const cart = await prisma.cart.create({
    data: { token: randomUUID(), recoveryToken: randomUUID(), userId: user.id, email: user.email },
  });
  await setCartCookie(cart.token);
}

export async function recoverCart(recoveryToken: string) {
  const cart = await prisma.cart.findUnique({ where: { recoveryToken } });
  if (!cart) return null;
  const updated = await prisma.cart.update({
    where: { id: cart.id },
    data: { status: "ACTIVE" },
  });
  await setCartCookie(updated.token);
  return updated;
}

export async function getCartItemCount() {
  const cart = await getCart();
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
