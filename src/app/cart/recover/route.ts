import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { recoverCart } from "@/lib/cart";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) redirect("/cart");

  const cart = await recoverCart(token).catch((error) => {
    console.error("[cart] recovery failed", error);
    return null;
  });

  if (!cart) redirect("/cart?error=recover");
  redirect("/cart?recovered=1");
}
