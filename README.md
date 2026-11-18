# M&R Homes

A production-ready M&R Homes storefront and admin panel built with Next.js 15, TypeScript, Tailwind CSS v4, PostgreSQL and Prisma.

## Features

- Storefront: homepage, catalog with search/category/price/stock filters, sorting and pagination, product pages with image gallery and reviews, cart, checkout and order confirmation.
- Accounts: register, email/password login, Google sign-in, password reset, profile, password change, saved addresses, order history, reorder and wishlist.
- Payments: Paystack initialize/verify/webhook integration plus a local mock payment flow for development.
- Admin: dashboard, revenue/traffic charts, products, categories, orders, status timeline, manual payment capture, customers, review moderation, abandoned carts, analytics, email log and store settings.
- Operations: transactional email with SMTP or console fallback, abandoned-cart reminders, PageView analytics, newsletter subscribers, sitemap and robots.
- Security: bcrypt password hashes, signed HTTP-only JWT sessions, admin role checks in middleware and server actions, HMAC-verified Paystack webhooks, input validation with Zod.

## Tech stack

- Next.js 15.5 (App Router, server actions)
- React 19 and TypeScript
- Tailwind CSS v4
- Prisma 6 and PostgreSQL
- Paystack
- Nodemailer
- Recharts

## Requirements

- Node.js 20.9 or newer
- PostgreSQL 14 or newer

## Getting started

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET and CRON_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Generate secrets with:

```bash
openssl rand -hex 32
```

### Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@shopwave.test` | `Admin123!` |
| Customer | `amina@example.com` | `Customer123!` |
| Customer | `tunde@example.com` | `Customer123!` |

The seed creates 33 home, plant and furniture products across 8 categories, plus demo orders, reviews, page views and an abandoned cart. Override the admin credentials with `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` before seeding.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical public URL, used for links, emails, sitemap and Paystack callback. |
| `AUTH_SECRET` | Yes | Long random string used to sign session JWTs. |
| `CRON_SECRET` | Yes | Bearer token for the abandoned-cart cron endpoint. |
| `PAYSTACK_SECRET_KEY` | Production | Paystack secret key. Leave empty for mock payments. |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Production | Paystack public key. |
| `PAYSTACK_MOCK` | No | Set `true` to force mock payments even when keys exist. |
| `SMTP_HOST` | No | SMTP host. When empty, emails are logged and printed to the server console. |
| `SMTP_PORT` | No | SMTP port, defaults to `587`. |
| `SMTP_USER` / `SMTP_PASS` | No | SMTP credentials. |
| `SMTP_SECURE` | No | `true` for implicit TLS, usually port 465. |
| `MAIL_FROM` | No | From header for transactional email. |
| `SUPPORT_EMAIL` | No | Reply-to/support address used in email templates. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID for Google sign-in. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | No | Override the callback URL. Defaults to `<origin>/api/auth/google/callback`. |
| `UPLOAD_DIR` | No | Persistent directory for uploaded product images. Defaults to `./storage/uploads`. |

## Payments

Mock mode is active when `PAYSTACK_SECRET_KEY` is empty or `PAYSTACK_MOCK=true`. Checkout redirects to a local mock payment page where the payment can be completed or failed. Real mode initializes a Paystack transaction and verifies it on callback.

Configure the Paystack webhook URL as:

```text
https://mandrhomes.com/api/webhooks/paystack
```

Enable at least `charge.success` and `charge.failed`. The webhook verifies the `x-paystack-signature` HMAC before updating an order. Payment marking is idempotent and decrements stock once.

## Google sign-in

Create an OAuth 2.0 Client ID (Web application) in the Google Cloud Console and add these authorized redirect URIs:

- `https://mandrhomes.com/api/auth/google/callback`
- `http://localhost:3000/api/auth/google/callback` (local development)

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The callback URL defaults to the current request origin; set
`GOOGLE_REDIRECT_URI` only when your proxy or custom domain requires an explicit URL. Google accounts are matched by
verified email, and new accounts are created automatically.

## Abandoned carts and cron

The settings page controls the inactivity window and maximum reminders per cart. Emails include a recovery link that restores the cart session.

Schedule a daily or hourly request:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://mandrhomes.com/api/cron/abandoned-carts
```

The endpoint supports `GET` and `POST`, and rejects requests when `CRON_SECRET` is missing or incorrect. Admins can also trigger reminders manually from `/admin/carts`.

## Analytics

The storefront tracker posts page views to `/api/track`. A first-party visitor cookie provides unique visitor counts. Bot user agents are skipped, and admin/API routes are not tracked. Reports are available at `/admin/analytics`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with Turbopack. |
| `npm run build` | Generate Prisma Client and build for production. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run db:migrate` | Create/apply a development migration. |
| `npm run db:seed` | Seed demo data. |
| `npm run db:studio` | Open Prisma Studio. |

## Deployment checklist

1. Provision PostgreSQL and set a production `DATABASE_URL`.
2. Set `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` and `CRON_SECRET`.
3. Run `npx prisma migrate deploy` during release.
4. Set Paystack keys and `PAYSTACK_MOCK=false`; configure the webhook.
5. Configure SMTP for real email delivery.
6. Mount a persistent disk and set `UPLOAD_DIR` for product images; serverless/ephemeral filesystems will lose uploads.
7. Run `npm run build` and `npm run start`, or deploy to a Next.js-compatible host.
8. Seed only if you want demo data. Change or remove demo credentials in production.
9. Schedule the abandoned-cart cron endpoint.

## Notes

- Prices are stored as integer minor units (kobo) and formatted with the store currency.
- Server actions re-check authentication and admin role on every mutation.
- Product, order and store settings changes revalidate affected storefront paths.
- Admin and account pages are excluded from search indexing and protected by middleware plus server-side checks.
