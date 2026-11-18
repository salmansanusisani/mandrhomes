import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How M&R Homes collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Privacy policy</h1>
        <p className="mt-3 text-xs text-muted">Last updated: {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">1. Who we are</h2>
            <p>
              {settings.storeName} operates this store. You can reach us at {settings.supportEmail}, {settings.address}, or {settings.address2}.
              This policy explains what information we collect when you use the store, why we collect it and how it is protected.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">2. Information we collect</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong className="text-ink">Account details:</strong> name, email address, phone number and a securely hashed password.</li>
              <li><strong className="text-ink">Order details:</strong> delivery addresses, items purchased, order notes and payment status.</li>
              <li><strong className="text-ink">Payment information:</strong> handled by Paystack. We receive a reference and status, never your full card details.</li>
              <li><strong className="text-ink">Usage data:</strong> pages visited, referral source, approximate country, browser type and a random session identifier.</li>
              <li><strong className="text-ink">Communications:</strong> emails you send to support and your newsletter preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">3. How we use your information</h2>
            <p>
              We use your information to process orders, deliver products, provide support, prevent fraud, improve the
              store and — only if you opt in — send you marketing emails. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">4. Cookies and analytics</h2>
            <p>
              We use essential cookies to keep you signed in and to remember your cart. We also use a first-party analytics
              cookie to understand which pages are popular. You can clear cookies at any time in your browser; essential
              cookies are required for the cart and checkout to work.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">5. Sharing</h2>
            <p>
              We share only what is necessary with service providers that help us operate: Paystack for payments, our email
              provider for transactional and marketing email, and our hosting provider. These providers process data on our
              instructions and under their own security obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">6. Retention and security</h2>
            <p>
              Order records are kept for as long as required for accounting and tax purposes. Passwords are hashed with
              bcrypt and never stored in plain text. Data is transmitted over HTTPS and access to admin tools is restricted.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">7. Your rights</h2>
            <p>
              You can request access to, correction of, or deletion of your personal data, and you can unsubscribe from
              marketing at any time. Email {settings.supportEmail} and we will respond within a reasonable period.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-ink">8. Changes</h2>
            <p>
              We may update this policy from time to time. Material changes will be announced on this page with a new
              effective date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
