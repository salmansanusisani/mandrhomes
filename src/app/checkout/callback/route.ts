import { NextResponse, type NextRequest } from "next/server";
import { verifyPayment } from "@/lib/paystack";
import { markOrderPaid, markOrderPaymentFailed } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/cart?error=missing_reference", url.origin));
  }

  try {
    const verification = await verifyPayment(reference);

    if (!verification.success) {
      await markOrderPaymentFailed(reference, "Verification failed");
      return NextResponse.redirect(new URL("/checkout?error=payment", url.origin));
    }

    const paid = await markOrderPaid(reference, { amountMinor: verification.amountMinor });
    if (!paid.ok || !paid.order) {
      return NextResponse.redirect(new URL("/checkout?error=payment", url.origin));
    }

    const response = NextResponse.redirect(
      new URL(`/checkout/success?order=${encodeURIComponent(paid.order.number)}`, url.origin),
    );
    response.cookies.set("shopwave_cart", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("[checkout/callback] verification failed", error);
    return NextResponse.redirect(new URL("/checkout?error=payment", url.origin));
  }
}
