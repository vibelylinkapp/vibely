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
- [ ] Legal review of the privacy policy and terms before launch
- [ ] **Run `select public.purge_demo_content();`** before public launch. The
      seeded demo members, plans, stories and events are now flagged
      `is_demo` and are excluded from People Nearby and the map, but they
      still appear in Discover, the stories rail and Trending until purged.
- [ ] **Scheduled data cleanup** — expired stories and soft-deleted messages
      are never purged. No cron job does this today.
- [ ] Expand beyond Nairobi city by city

## Account deletion

Members delete their own account from **Account & settings** on `/profile`.
The flow is `components/DeleteAccount.tsx` → `POST /api/account/delete`, which:

1. requires a live session and a typed `DELETE` confirmation;
2. writes an `account_deletions` audit row **before** destroying anything —
   if the audit write fails, the deletion does not proceed;
3. recursively removes the member's files from the `avatars`, `post-media`,
   `chat-media` and `verifications` buckets;
4. deletes the `auth.users` row, which cascades to `profiles` and onward;
5. stamps the audit row and clears the session cookie.

Retained by design (see `supabase/migrations/0030_account_deletion.sql`):
payment records, `admin_actions`, and reports about the deleted member —
these are `SET NULL` rather than `CASCADE`, and a `before delete` trigger on
`profiles` stamps `reports.reported_snapshot` so moderation history survives
without keeping a live profile.
