import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about orders, delivery, returns and payments.",
};

const FAQS = [
  {
    question: "How long will my order take to arrive?",
    answer:
      "Orders are dispatched within one business day. Lagos and Abuja deliveries usually arrive in 1–2 working days, and the rest of Nigeria in 3–5 working days.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept debit and credit cards, bank transfer, USSD and mobile money through Paystack. You do not need a Paystack account.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes. Payments are processed by Paystack, a PCI-DSS compliant processor. Your card details are entered on Paystack's secure page and never touch our servers.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "If your order has not shipped yet, contact us as soon as possible and we will do our best to amend it. Once dispatched, you can return it under our 14-day policy.",
  },
  {
    question: "Do you deliver outside Nigeria?",
    answer:
      "We currently deliver within Nigeria. For international orders, contact support with your address and we will check whether we can arrange a special delivery.",
  },
  {
    question: "How do returns work?",
    answer:
      "You have 14 days from delivery to return unused items in their original packaging. Email us with your order number and we will send return instructions. See the shipping & returns page for details.",
  },
  {
    question: "Do you offer restock notifications?",
    answer:
      "Join our newsletter for restock alerts, or check the product page — we update stock in real time.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Sign in and open the Orders section of your account. Payment and shipping updates are posted to your order timeline and emailed to you.",
  },
];

export default async function FaqPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Help centre</p>
        <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Quick answers about orders, delivery, returns and payments. Still stuck? {" "}
          <Link href="/contact" className="text-brand underline">Talk to us</Link>.
        </p>

        <div className="mt-10 divide-y divide-sand border-y border-sand">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {faq.question}
                <span className="text-lg text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-brand-soft p-6">
          <h2 className="text-lg font-semibold">Still need help?</h2>
          <p className="mt-1 text-sm text-muted">
            Email <a href={`mailto:${settings.supportEmail}`} className="text-brand underline">{settings.supportEmail}</a>{" "}
            or call {settings.supportPhone}. We reply within one business day.
          </p>
          <Link href="/contact" className="btn-primary mt-4">Contact support</Link>
        </div>
      </div>
    </div>
  );
}
