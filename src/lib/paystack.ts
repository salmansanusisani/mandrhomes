import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { absoluteUrl } from "./utils";

const API_BASE = "https://api.paystack.co";

function secretKey() {
  return process.env.PAYSTACK_SECRET_KEY ?? "";
}

export function paymentsAreMock() {
  return process.env.PAYSTACK_MOCK === "true" || !secretKey();
}

export type InitializePaymentInput = {
  email: string;
  amountMinor: number;
  reference: string;
  metadata?: Record<string, unknown>;
};

export type InitializePaymentResult = {
  mock: boolean;
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
};

export async function initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
  if (paymentsAreMock()) {
    return {
      mock: true,
      authorizationUrl: `/checkout/mock?reference=${encodeURIComponent(input.reference)}`,
      reference: input.reference,
    };
  }

  const response = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      reference: input.reference,
      callback_url: absoluteUrl("/checkout/callback"),
      metadata: input.metadata ?? {},
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    }),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: { authorization_url: string; access_code: string; reference: string } }
    | null;

  if (!response.ok || !json?.status || !json.data) {
    throw new Error(json?.message || "Unable to start Paystack payment. Please try again.");
  }

  return {
    mock: false,
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export type VerifyPaymentResult = {
  success: boolean;
  amountMinor: number | null;
  currency: string | null;
  reference: string;
  mock: boolean;
  metadata?: Record<string, unknown> | null;
};

export async function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  if (paymentsAreMock()) {
    return { success: true, amountMinor: null, currency: null, reference, mock: true };
  }

  const response = await fetch(`${API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as
    | {
        status?: boolean;
        message?: string;
        data?: { status: string; amount: number; currency: string; reference: string; metadata?: Record<string, unknown> };
      }
    | null;

  if (!response.ok || !json?.status || !json.data) {
    return { success: false, amountMinor: null, currency: null, reference, mock: false };
  }

  return {
    success: json.data.status === "success",
    amountMinor: Number(json.data.amount),
    currency: json.data.currency ?? null,
    reference: json.data.reference ?? reference,
    mock: false,
    metadata: json.data.metadata ?? null,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const key = secretKey();
  if (!key || !signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
