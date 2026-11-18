import "server-only";
import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { EmailType } from "@prisma/client";
import { prisma } from "./db";
import { getSettings, type StoreSettings } from "./settings";
import { absoluteUrl, formatMoney } from "./utils";

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
type CartWithProducts = Prisma.CartGetPayload<{
  include: { items: { include: { product: { include: { images: true } } } } };
}>;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  userId?: string | null;
  orderId?: string | null;
};

export async function sendEmail({ to, subject, html, type, userId, orderId }: SendEmailInput) {
  try {
    const transport = getTransporter();
    if (transport) {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? "M&R Homes <no-reply@mandrhomes.com>",
        to,
        subject,
        html,
      });
    } else {
      console.info(`[email:dev] "${subject}" -> ${to} (set SMTP_HOST to send for real)`);
    }
    await prisma.emailLog.create({
      data: { to, subject, type, status: "SENT", userId: userId ?? null, orderId: orderId ?? null },
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error(`[email] Failed to send "${subject}" to ${to}: ${message}`);
    try {
      await prisma.emailLog.create({
        data: { to, subject, type, status: "FAILED", error: message, userId: userId ?? null, orderId: orderId ?? null },
      });
    } catch {
      // ignore logging failure
    }
    return false;
  }
}

function layout(settings: StoreSettings, title: string, body: string, preview?: string) {
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#182420;">
    ${preview ? `<span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(preview)}</span>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e3d9;">
          <tr><td style="background:#0f3d2e;padding:22px 32px;">
            <a href="${absoluteUrl("/")}" style="color:#ffffff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(settings.storeName)}</a>
          </td></tr>
          <tr><td style="padding:36px 32px 12px;">
            <h1 style="margin:0 0 16px;font-size:23px;line-height:1.25;color:#14201c;">${escapeHtml(title)}</h1>
            ${body}
          </td></tr>
          <tr><td style="padding:20px 32px 32px;border-top:1px solid #eeeae1;color:#6b7570;font-size:12px;line-height:1.6;">
            <p style="margin:0 0 6px;">Need help? Reply to this email or contact <a href="mailto:${escapeHtml(settings.supportEmail)}" style="color:#0f5132;">${escapeHtml(settings.supportEmail)}</a>.</p>
            <p style="margin:0;">${escapeHtml(settings.storeName)} · ${escapeHtml(settings.address)} · ${escapeHtml(settings.address2)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#0f5132;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">${escapeHtml(label)}</a>`;
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.65;color:#3f4a45;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function money(amount: number, settings: StoreSettings) {
  return formatMoney(amount, settings.currency);
}

function addressBlock(address: unknown) {
  const data = (address ?? {}) as Record<string, string | undefined>;
  const parts = [
    data.fullName,
    data.line1,
    data.line2,
    [data.city, data.state].filter(Boolean).join(", "),
    data.postalCode,
    data.country,
    data.phone,
  ].filter(Boolean);
  return escapeHtml(parts.join("<br>")).replace(/&lt;br&gt;/g, "<br>");
}

export async function sendWelcomeEmail(user: { id: string; email: string; name: string }) {
  const settings = await getSettings();
  const body = `
    ${paragraphs(`Hi ${user.name},\n\nWelcome to ${settings.storeName}. Your account is ready — save your favourites, track orders and check out faster.`)}
    <p style="margin:24px 0;">${button(absoluteUrl("/products"), "Start shopping")}</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${settings.storeName}`,
    html: layout(settings, `Welcome, ${user.name}`, body, `Your ${settings.storeName} account is ready.`),
    type: EmailType.WELCOME,
    userId: user.id,
  });
}

export async function sendOrderConfirmationEmail(order: OrderWithItems) {
  const settings = await getSettings();
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eeeae1;color:#3f4a45;">${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eeeae1;text-align:right;color:#14201c;font-weight:600;">${money(item.price * item.quantity, settings)}</td>
      </tr>`,
    )
    .join("");

  const body = `
    ${paragraphs(`Hi ${order.customerName},\n\nThank you for your order. We have received your payment and will start preparing it shortly.`)}
    <p style="margin:0 0 6px;color:#6b7570;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Order ${escapeHtml(order.number)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;">${rows}
      <tr><td style="padding:10px 0;color:#6b7570;">Subtotal</td><td style="padding:10px 0;text-align:right;">${money(order.subtotal, settings)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7570;">Shipping</td><td style="padding:4px 0;text-align:right;">${order.shipping === 0 ? "Free" : money(order.shipping, settings)}</td></tr>
      ${order.tax > 0 ? `<tr><td style="padding:4px 0;color:#6b7570;">Tax</td><td style="padding:4px 0;text-align:right;">${money(order.tax, settings)}</td></tr>` : ""}
      <tr><td style="padding:12px 0 0;font-weight:700;border-top:1px solid #eeeae1;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:700;border-top:1px solid #eeeae1;">${money(order.total, settings)}</td></tr>
    </table>
    <h2 style="font-size:15px;margin:24px 0 8px;">Delivery address</h2>
    <p style="margin:0 0 20px;line-height:1.6;color:#3f4a45;">${addressBlock(order.shippingAddress)}</p>
    <p style="margin:24px 0;">${button(absoluteUrl(`/account/orders/${order.number}`), "View your order")}</p>
  `;
  return sendEmail({
    to: order.email,
    subject: `Order confirmed — ${order.number}`,
    html: layout(settings, "Order confirmed", body, `Thanks for shopping with ${settings.storeName}.`),
    type: EmailType.ORDER_CONFIRMATION,
    userId: order.userId,
    orderId: order.id,
  });
}

const STATUS_COPY: Record<string, string> = {
  PAID: "Your payment is confirmed and your order is queued for packing.",
  PROCESSING: "We are packing your order now.",
  SHIPPED: "Good news — your order is on its way.",
  DELIVERED: "Your order has been delivered. We hope you love it.",
  CANCELLED: "Your order has been cancelled. If you were charged, a refund will follow shortly.",
  REFUNDED: "Your order has been refunded.",
  PENDING: "Your order is awaiting payment.",
};

export async function sendOrderStatusEmail(order: OrderWithItems, status: string) {
  const settings = await getSettings();
  const body = `
    ${paragraphs(`Hi ${order.customerName},\n\n${STATUS_COPY[status] ?? `Your order status is now ${status}.`}`)}
    <p style="margin:0 0 20px;color:#6b7570;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Order ${escapeHtml(order.number)}</p>
    <p style="margin:24px 0;">${button(absoluteUrl(`/account/orders/${order.number}`), "Track your order")}</p>
  `;
  return sendEmail({
    to: order.email,
    subject: `Order ${escapeHtml(order.number)} — ${status.toLowerCase()}`,
    html: layout(settings, `Order ${status.toLowerCase()}`, body),
    type: EmailType.ORDER_STATUS,
    userId: order.userId,
    orderId: order.id,
  });
}

export async function sendAbandonedCartEmail(cart: CartWithProducts, recoveryUrl: string) {
  const settings = await getSettings();
  const items = cart.items
    .map((item) => {
      const image = item.product.images[0]?.url;
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eeeae1;width:52px;">${
          image
            ? `<img src="${escapeHtml(image)}" width="44" height="44" alt="" style="border-radius:8px;object-fit:cover;display:block;">`
            : ""
        }</td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #eeeae1;color:#3f4a45;">${escapeHtml(item.product.name)} × ${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eeeae1;text-align:right;color:#14201c;font-weight:600;">${money(item.product.price * item.quantity, settings)}</td>
      </tr>`;
    })
    .join("");

  const body = `
    ${paragraphs(`Still thinking it over?\n\nThe items in your cart are waiting for you. We cannot reserve stock forever, so complete your order while they are still available.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;">${items}</table>
    <p style="margin:24px 0;">${button(recoveryUrl, "Return to your cart")}</p>
    <p style="margin:0;font-size:12px;color:#8a938e;">If you have already completed your order, please ignore this email.</p>
  `;
  return sendEmail({
    to: cart.email ?? "",
    subject: `Your ${settings.storeName} cart is still waiting`,
    html: layout(settings, "Your cart is still waiting", body, "Pick up where you left off."),
    type: EmailType.ABANDONED_CART,
    userId: cart.userId,
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name: string }, resetUrl: string) {
  const settings = await getSettings();
  const body = `
    ${paragraphs(`Hi ${user.name},\n\nWe received a request to reset your ${settings.storeName} password. This link is valid for one hour.`)}
    <p style="margin:24px 0;">${button(resetUrl, "Reset your password")}</p>
    <p style="margin:0;font-size:12px;color:#8a938e;">If you did not request this, you can safely ignore this email.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: `Reset your ${settings.storeName} password`,
    html: layout(settings, "Reset your password", body),
    type: EmailType.PASSWORD_RESET,
    userId: user.id,
  });
}

export async function sendNewsletterWelcomeEmail(email: string) {
  const settings = await getSettings();
  const body = `
    ${paragraphs(`Thanks for subscribing to ${settings.storeName}.\n\nYou will be the first to hear about new arrivals, restocks and occasional offers. No spam — unsubscribe any time.`)}
    <p style="margin:24px 0;">${button(absoluteUrl("/products"), "Browse the shop")}</p>
  `;
  return sendEmail({
    to: email,
    subject: `You are on the list — ${settings.storeName}`,
    html: layout(settings, "You are on the list", body),
    type: EmailType.NEWSLETTER,
  });
}
