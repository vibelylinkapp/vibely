# Vibely

The easiest way to meet real people near you — a social discovery platform for
Kenya and East Africa (dating, friends, hangouts, networking).

This repo is a **Next.js 15 (App Router) PWA**. The marketing site and the
product both live here; the product runs on Supabase.

## Stack

- Next.js 15 + React 19 + TypeScript
- Supabase (Postgres + PostGIS, Auth, Realtime, Storage)
- M-Pesa (Safaricom Daraja) for subscriptions and boosts
- Web Push for notifications
- Deployed on Vercel (auto-deploys on every push to `main`)

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Environment

Copy `.env.example` to `.env.local` and fill in your Supabase + M-Pesa keys.

## Project layout

```
app/
  page.tsx            Landing page (marketing)
  about|safety|       Public content pages
  privacy|terms/
  (auth)/sign-in      Phone OTP + Google sign-in
  (app)/              The product, behind auth
  admin/              Moderation panel (reachable only via ADMIN_PATH)
  api/                Route handlers (like, pass, follow, feed, boost,
                      push, mpesa, cron, unread, admin)
components/           UI components (SwipeDeck, Chat, Stories, Highlights,
                      NearbyExplorer, PlansExplorer, Heatmap, UpgradeTiers,
                      VerificationSetup, ...)
lib/                  Supabase clients, generated DB types, M-Pesa, tiers,
                      entitlements, feed helpers, site config
supabase/             SQL migrations
```

## Editing the marketing and legal pages

Company details, contact addresses and app-store links live in one place:
**`lib/site.ts`**. The about, safety, privacy and terms pages read from it, so
change it there rather than editing each page.

App-store badges are driven by `SITE.stores`. While those values are `null` the
landing page shows a "coming soon" line; set them to the live listing URLs and
real store buttons appear automatically.

## Database

The full Postgres/PostGIS schema (profiles, intents, chat, stories, plans,
reports, subscriptions, M-Pesa payments, RLS policies, and a
`nearby_profiles()` function) lives in `supabase/migrations/`.

## Status

Shipped:

- [x] Branded landing page, plus about / safety / privacy / terms
- [x] Auth: phone OTP + Google
- [x] Onboarding + rich profiles (avatar, cover, gallery, highlights)
- [x] Discover: swipe deck, nearby people, top matches, liked-you
- [x] In-app chat with Supabase Realtime, including voice notes
- [x] Stories and a social feed (posts, likes, comments)
- [x] Events and plans, with booking and check-ins
- [x] Safety and moderation: verification, reporting, blocking, admin panel
- [x] M-Pesa subscriptions, tiers, entitlements and boosts
- [x] Web push notifications
- [x] Nearby heatmap

Next:

- [ ] Android and iOS store builds
- [ ] Set `legalEntity` in `lib/site.ts` to the registered company name
- [ ] Legal review of the privacy policy and terms before launch
- [ ] **Self-service account deletion** — there is no delete flow in the app.
      The privacy page currently directs members to email us instead.
- [ ] **Scheduled data cleanup** — expired stories, soft-deleted messages and
      closed accounts are never purged. No cron job does this today.
- [ ] Fix the "renews <date>" label in `UpgradeTiers.tsx` — subscriptions do
      not auto-renew, they expire after `SUBSCRIPTION_DAYS`
- [ ] Remove or clearly mark the seeded demo profiles, events and stories
      (migrations 0017, 0021, 0026) before public launch
- [ ] Expand beyond Nairobi city by city
