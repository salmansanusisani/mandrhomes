import type { Metadata } from "next";
import { CreditCard, Database, Mail, ShieldCheck, Timer } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { paymentsAreMock } from "@/lib/paystack";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const mockPayments = paymentsAreMock();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const cronConfigured = Boolean(process.env.CRON_SECRET);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const integrations = [
    {
      icon: CreditCard,
      title: "Paystack",
      ok: !mockPayments,
      detail: mockPayments ? "Mock mode is active. Add PAYSTACK_SECRET_KEY and set PAYSTACK_MOCK=false to accept real payments." : "Live keys configured. Webhook and verification are enabled.",
    },
    {
      icon: Mail,
      title: "Transactional email",
      ok: smtpConfigured,
      detail: smtpConfigured ? "SMTP is configured. Emails are delivered to customers." : "No SMTP host configured. Emails are logged and printed to the server console.",
    },
    {
      icon: Timer,
      title: "Abandoned cart cron",
      ok: cronConfigured,
      detail: cronConfigured ? "CRON_SECRET is set. Schedule a daily GET to /api/cron/abandoned-carts with the Bearer token." : "CRON_SECRET is missing. The cron endpoint will reject requests until it is set.",
    },
    {
      icon: Database,
      title: "Storefront URL",
      ok: true,
      detail: appUrl,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Configuration</p>
        <h1 className="display mt-1 text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Store identity, pricing rules, support details and automation.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {integrations.map((item) => (
          <div key={item.title} className="rounded-2xl border border-sand bg-white p-4">
            <div className="flex items-center justify-between">
              <item.icon className="h-4 w-4 text-brand" />
              <span className={`badge ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {item.ok ? "Ready" : "Setup needed"}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-sand bg-white p-4 text-xs text-muted">
        <p className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-brand" /> Security note</p>
        <p className="mt-1">Secrets are read from environment variables and are never stored in the database or shown in this panel. Admin actions are re-checked server-side on every request.</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
