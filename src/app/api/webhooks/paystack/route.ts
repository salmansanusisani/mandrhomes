import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { markOrderPaid, markOrderPaymentFailed } from "@/lib/orders";

export const runtime = "nodejs";

type PaystackEvent = {
  event: string;
  data?: {
    reference?: string;
    amount?: number;
    status?: string;
    gateway_response?: string;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = event.data?.reference;
  try {
    if (event.event === "charge.success" && reference) {
      await markOrderPaid(reference, { amountMinor: event.data?.amount ?? null });
    } else if ((event.event === "charge.failed" || event.event === "transfer.failed") && reference) {
      await markOrderPaymentFailed(reference, event.data?.gateway_response);
    }
  } catch (error) {
    console.error("[webhook/paystack] handler failed", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
