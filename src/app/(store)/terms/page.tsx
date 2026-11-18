import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you shop with M&R Homes.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Terms of service</h1>
        <p className="mt-3 text-xs text-muted">Last updated: {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">1. Using the store</h2>
            <p>
              By shopping with {settings.storeName} you agree to these terms. You must be at least 18 years old, or have
              permission from a parent or guardian, to place an order. You agree to provide accurate account and delivery
              information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">2. Products and pricing</h2>
            <p>
              We work hard to describe products accurately, but colours may vary slightly between screens. Prices are
              displayed in {settings.currency} and include applicable taxes unless stated otherwise. We may change prices
              or withdraw products at any time. If a price is listed incorrectly, we may cancel the affected order and
              refund any payment.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">3. Orders and payment</h2>
            <p>
              An order is an offer to buy. It is accepted when we confirm payment and send a confirmation email. Payments
              are processed by Paystack. Stock is reserved only after payment is confirmed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">4. Delivery</h2>
            <p>
              Delivery estimates are not guarantees and may be affected by weather, public holidays or courier delays. Risk
              in the goods passes to you on delivery. If you are unavailable, the courier may leave the parcel with a
              neighbour or retry on another day.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">5. Returns and refunds</h2>
            <p>
              Our 14-day return policy is part of these terms. Items must be unused and in original packaging. Refunds are
              issued to the original payment method within 5–10 business days of us receiving the return. Used candles and diffusers
              cannot be returned.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">6. Accounts</h2>
            <p>
              You are responsible for keeping your password secure and for activity under your account. Tell us immediately
              if you believe your account has been compromised. We may suspend accounts involved in fraud or abuse.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">7. Intellectual property</h2>
            <p>
              The store design, copy, logo and photography are owned by {settings.storeName} or its licensors and may not be
              copied or reused without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">8. Limitation of liability</h2>
            <p>
              To the extent permitted by law, our liability for any order is limited to the amount you paid for it. Nothing
              in these terms limits rights you have under applicable consumer protection law.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">9. Contact</h2>
            <p>Questions about these terms? Email {settings.supportEmail}.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
