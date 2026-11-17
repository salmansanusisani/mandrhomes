import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { sendAbandonedCartEmail } from "./email";
import { absoluteUrl } from "./utils";

export async function sendAbandonedCartReminders(options: { cartId?: string; force?: boolean; limit?: number } = {}) {
  const settings = await getSettings();
  const now = Date.now();
  const cutoff = new Date(now - settings.abandonedCartHours * 60 * 60 * 1000);
  const reminderCooldown = new Date(now - 24 * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      ...(options.cartId ? { id: options.cartId } : {}),
      email: { not: null },
      status: { in: ["ACTIVE", "ABANDONED"] },
      reminderCount: { lt: settings.abandonedCartMaxReminders },
      items: { some: {} },
      ...(options.force
        ? {}
        : {
            updatedAt: { lt: cutoff },
            OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: reminderCooldown } }],
          }),
    },
    include: {
      items: { include: { product: { include: { images: true } } } },
    },
    orderBy: { updatedAt: "asc" },
    take: options.limit ?? 50,
  });

  let sent = 0;
  let failed = 0;

  for (const cart of carts) {
    if (!cart.email) continue;
    const recoveryUrl = absoluteUrl(`/cart/recover?token=${cart.recoveryToken}`);
    const ok = await sendAbandonedCartEmail(cart, recoveryUrl);
    if (ok) {
      sent += 1;
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          reminderCount: { increment: 1 },
          lastReminderAt: new Date(),
          status: "ABANDONED",
        },
      });
    } else {
      failed += 1;
    }
  }

  return { sent, failed, checked: carts.length };
}
