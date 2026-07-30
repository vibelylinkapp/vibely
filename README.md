# Vibely

The easiest way to meet real people near you — a social discovery platform for Kenya and East Africa (dating, friends, hangouts, networking).

This repo is a **Next.js 15 (App Router) PWA** with the Vibely brand wired in. The branded landing page is live; the product (auth, discovery, in-app chat) is built on Supabase.

## Stack
- Next.js 15 + React 19 + TypeScript
- Supabase (Postgres + PostGIS, Auth, Realtime, Storage)
- Deployed on Vercel (auto-deploys on every push to `main`)

## Local development
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Environment
Copy `.env.example` to `.env.local` and fill in your Supabase + M-Pesa keys.

## Database
The full Postgres/PostGIS schema (profiles, intents, chat, stories, plans, reports, subscriptions, M-Pesa payments, RLS policies, and a `nearby_profiles()` function) is maintained in Town. Run it in your Supabase project's SQL editor, then commit it to `supabase/migrations/0001_init.sql`.

## Roadmap
- [x] Branded landing page (waitlist form is a front-end placeholder — wire it to a Supabase `waitlist` table)
- [ ] Auth: phone OTP + Google
- [ ] Onboarding + rich profiles
- [ ] Discover: nearby people by intent
- [ ] In-app chat (Supabase Realtime) — the core differentiator
- [ ] Stories, safety/moderation, M-Pesa subscriptions
