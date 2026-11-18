import "server-only";
import { randomBytes } from "crypto";
import { OrderStatus } from "@prisma/client";

import { prisma } from "./db";
import { getSettings } from "./settings";
import { summarizeCart, type CartWithItems } from "./cart";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "./email";


function newOrderNumber() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `SW-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function newPaymentReference() {
  return `PS-${randomBytes(12).toString("hex").toUpperCase()}`;
}

export type OrderActor = {
  id?: string | null;
  name: string;
  role?: string | null;
};

function actorFields(actor?: OrderActor | null) {
  if (!actor) return {};
  return {
    actorId: actor.id ?? null,
    actorName: actor.name,
    actorRole: actor.role ?? null,
  };
}

export type CheckoutCustomer = {
  customerName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  notes?: string;
};

export async function createOrderFromCart(options: {
  cart: CartWithItems;
  customer: CheckoutCustomer;
  userId: string | null;
}) {
  const { cart, customer, userId } = options;
  if (cart.items.length === 0) throw new Error("Your cart is empty.");

  for (const item of cart.items) {
    if (!item.product.isActive) throw new Error(`${item.product.name} is no longer available.`);
    if (item.quantity > item.product.stock) {
      throw new Error(`Only ${item.product.stock} × ${item.product.name} left in stock.`);
    }
  }

  const settings = await getSettings();
  const summary = summarizeCart(cart, settings, customer.state);
  const reference = newPaymentReference();
  const shippingAddress = {
    fullName: customer.customerName,
    email: customer.email,
    phone: customer.phone,
    line1: customer.line1,
    line2: customer.line2 ?? "",
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode ?? "",
    country: customer.country,
  };

  const order = await prisma.order.create({
    data: {
      number: newOrderNumber(),
      userId,
      cartId: cart.id,
      email: customer.email,
      customerName: customer.customerName,
      phone: customer.phone,
      status: OrderStatus.PENDING,
      paymentStatus: "PENDING",
      paymentReference: reference,
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      tax: summary.tax,
      total: summary.total,
      currency: settings.currency,
      shippingAddress,
      billingAddress: shippingAddress,
      notes: customer.notes,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0]?.url,
        })),
      },
      events: { create: { message: "Order created" } },
    },
    include: { items: true },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { email: customer.email, userId: userId ?? undefined },
  });

  return { order, reference };
}

export async function markOrderPaid(
  reference: string,
  options: { amountMinor?: number | null; actor?: OrderActor | null } = {},
) {
  const order = await prisma.order.findUnique({
    where: { paymentReference: reference },
    include: { items: true },
  });

  if (!order) {
    console.warn(`[payments] Received payment for unknown reference ${reference}`);
    return { ok: false, reason: "not_found" as const, order: null };
  }

  if (order.paymentStatus === "SUCCESS") {
    return { ok: true, order, alreadyPaid: true };
  }

  if (options.amountMinor != null && options.amountMinor < order.total) {
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        message: `Payment amount mismatch: received ${options.amountMinor}, expected ${order.total}`,
        ...actorFields(options.actor),
      },
    });
    return { ok: false, reason: "amount_mismatch" as const, order };
  }

  const paid = await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "SUCCESS" } },
      data: { paymentStatus: "SUCCESS", status: OrderStatus.PAID, paidAt: new Date() },
    });
    if (claim.count === 0) return null;

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.$executeRaw`
        UPDATE "Product"
        SET "stock" = GREATEST("stock" - ${item.quantity}, 0), "updatedAt" = NOW()
        WHERE "id" = ${item.productId}
      `;
    }

    if (order.cartId) {
      await tx.cart.updateMany({ where: { id: order.cartId }, data: { status: "CONVERTED" } });
    }

    await tx.orderEvent.create({
      data: { orderId: order.id, message: "Payment confirmed", ...actorFields(options.actor) },
    });
    return tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
  });

  if (!paid) {
    return { ok: true, order, alreadyPaid: true };
  }

  await sendOrderConfirmationEmail(paid).catch((error) => {
    console.error("[email] order confirmation failed", error);
  });

  return { ok: true, order: paid };
}

export async function markOrderPaymentFailed(reference: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { paymentReference: reference } });
  if (!order || order.paymentStatus === "SUCCESS") return;
  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } }),
    prisma.orderEvent.create({
      data: { orderId: order.id, message: reason ? `Payment failed: ${reason}` : "Payment failed" },
    }),
  ]);
}

export async function setOrderStatus(orderId: string, status: OrderStatus, actor?: OrderActor | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;
  if (order.status === status) return order;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: order.id },
      data: {
        status,
        ...(status === OrderStatus.DELIVERED && order.paymentStatus === "SUCCESS" ? { paidAt: order.paidAt ?? new Date() } : {}),
      },
      include: { items: true },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        message: `Status changed from ${order.status} to ${status}`,
        ...actorFields(actor),
      },
    });

    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED && order.paymentStatus === "SUCCESS") {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.$executeRaw`
          UPDATE "Product"
          SET "stock" = "stock" + ${item.quantity}, "updatedAt" = NOW()
          WHERE "id" = ${item.productId}
        `;
      }
      await tx.orderEvent.create({
        data: { orderId: order.id, message: "Stock restored after cancellation", ...actorFields(actor) },
      });
    }

    return next;
  });

  await sendOrderStatusEmail(updated, status).catch((error) => {
    console.error("[email] order status email failed", error);
  });

  return updated;
}

export async function getOrderByNumber(number: string, userId?: string) {
  return prisma.order.findFirst({
    where: { number, ...(userId ? { userId } : {}) },
    include: { items: true, events: { orderBy: { createdAt: "desc" } } },
  });
}
