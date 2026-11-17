"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCart, clearCartCookie, summarizeCart } from "@/lib/cart";
import { getSession, getClientIp } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { createOrderFromCart, markOrderPaid } from "@/lib/orders";
import { initializePayment, paymentsAreMock } from "@/lib/paystack";
import type { ActionState } from "@/lib/types";

export async function placeOrderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const limit = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!limit.success) return { ok: false, message: "Too many checkout attempts. Please wait a moment." };

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return { ok: false, message: "Your cart is empty. Add an item before checking out." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode") ?? "",
    country: formData.get("country") ?? "Nigeria",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the delivery details.", errors: fieldErrors(parsed.error) };
  }

  const session = await getSession();
  const settings = await getSettings();
  const summary = summarizeCart(cart, settings);

  if (summary.count === 0) return { ok: false, message: "Your cart is empty." };

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return {
        ok: false,
        message: `Only ${item.product.stock} × ${item.product.name} left. Please update your cart.`,
      };
    }
  }

  let authorizationUrl: string;
  try {
    const { order, reference } = await createOrderFromCart({
      cart,
      customer: parsed.data,
      userId: session?.id ?? null,
    });

    const payment = await initializePayment({
      email: parsed.data.email,
      amountMinor: order.total,
      reference,
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
        customerName: parsed.data.customerName,
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        message: payment.mock ? "Mock payment initialized (development mode)" : "Paystack payment initialized",
      },
    });

    authorizationUrl = payment.authorizationUrl;
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  } catch (error) {
    console.error("[checkout] failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Could not start checkout. Please try again." };
  }

  redirect(authorizationUrl);
}

export async function completeMockPaymentAction(formData: FormData) {
  if (!paymentsAreMock()) redirect("/");

  const reference = String(formData.get("reference") ?? "");
  if (!reference) redirect("/cart");

  const result = await markOrderPaid(reference, { amountMinor: null });
  if (!result.ok || !result.order) redirect("/cart?error=payment");

  await clearCartCookie();
  revalidatePath("/", "layout");
  redirect(`/checkout/success?order=${result.order.number}`);
}

export async function cancelMockPaymentAction(formData: FormData) {
  const reference = String(formData.get("reference") ?? "");
  if (reference && paymentsAreMock()) {
    await prisma.order.updateMany({
      where: { paymentReference: reference, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }
  redirect("/checkout?cancelled=1");
}
