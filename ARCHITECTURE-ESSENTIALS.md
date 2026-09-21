# Architecture essentials

The short version. Read this before touching anything; read `ARCHITECTURE.md`
when you need detail.

## Stack

Next.js 15.5.22 App Router, React 19, TypeScript 5.7. Supabase for Postgres,
auth, storage, and realtime. Deployed on Vercel, auto-deploying from `main`.
Live at https://vibely-inky.vercel.app. Supabase project ref
`gimllbqpcytshovqdnfm`.

## The six things that will bite you

1. **`lib/database.types.ts` is hand-maintained, not generated.** Add a column
   or table in a migration and you must add it here too, or the build fails on
   a type error.

2. **Migrations do not run themselves.** There is no migration runner in the
   deploy pipeline. Committing `supabase/migrations/00XX_*.sql` changes
   nothing until someone runs it in the Supabase SQL editor. Code that assumes
   a new column will fail in production while passing locally.

3. **A merged pull request is not a deployed one.** Vercel can fail the build
   and every PR still shows as merged. Confirm a deploy by fetching the live
   bundle and grepping for a marker from your change.

4. **Signed-in pages are all `force-dynamic`.** Twenty-two of them. Every
   navigation is a fresh server render plus Supabase round trips. Assume no
   caching unless you added it.

5. **Auth costs two network round trips per navigation.** `middleware.ts` calls
   `supabase.auth.getUser()` on every request, and each page calls it again.
   There are 53 call sites. `getUser()` is a network call to Supabase Auth, not
   a local token decode.

6. **The service role bypasses RLS.** Any tooling authenticated as the service
   role can read every row regardless of policy, so it cannot be used to verify
   that a policy restricts anyone.

## Route layout

```
app/
  (app)/      signed-in surface, 23 pages, shared shell in layout.tsx
  (auth)/     sign-in
  admin/      11 pages, gated once in admin/layout.tsx
  api/        19 route handlers
  page.tsx    public landing, plus /about /terms /privacy /safety
```

`app/(app)/layout.tsx` renders the tab bar once for the whole group. Do not
re-add `<BottomNav />` to a page: a Suspense fallback replaces everything below
its boundary, so a page-level nav means every navigation blanks the entire
viewport. That was the white-flash bug.

## Admin access

Two independent grants, either sufficient: `profiles.is_admin`, or an email on
the `ADMIN_EMAILS` allowlist. The allowlist is an active security finding —
see `SECURITY-AUDIT.md`, HIGH-1.

The panel lives at `/admin` but a direct hit returns 404. It is only reachable
through the unguessable base path in `lib/admin/path.ts`, rewritten by
middleware.

## Money

- **Subscriptions** — M-Pesa STK push via Daraja into the platform till.
- **Event tickets** — STK push holds a seat as `pending_payment`; only
  `/api/mpesa/callback` can confirm it. The browser cannot, by RLS.
- **Host payouts** — Paystack split, platform keeps 10 percent, the host's
  share settles straight to their M-Pesa. Nothing is held on the host's behalf,
  so the platform **cannot refund a ticket**; the Terms say so explicitly.

Paystack's docs contradict themselves on `percentage_charge`. The value is the
**platform's** cut (10). The per-transaction `split.share` is the **host's**
(90). Both derive from `DEFAULT_COMMISSION_PCT`; read the comment in
`lib/paystack.ts` before changing either.

## Feature flags

`lib/features.ts`. Stories, feed, heatmap, top matches, boosts and the chat tab
are density-dependent and default **off** — the code is correct but looks dead
with 16 profiles. One env var each.

## Before blaming the code

This repository has repeatedly presented as broken rendering when the real
problem was empty data: `last_active_at` was never written, `profiles.geo` was
entirely null so Nearby returned nobody. Query the table first.
