# Security audit

Audited 21 September 2026 against commit `cb419e7`.

Method: static review of all 41 pages, 19 API route handlers, 52 migrations,
the middleware, and the Supabase client factories. Findings below are grounded
in code that was read, not inferred from naming.

**This audit was performed by an AI agent and has not been reviewed by a
security professional or a lawyer.** Treat it as a prioritised starting point.

---

## Summary

| Severity | Count | Items |
|---|---|---|
| High | 2 | Admin escalation via unverified signup; optional M-Pesa callback secret |
| Medium | 2 | No rate limiting anywhere; account enumeration on signup |
| Low | 1 | Weak password minimum |
| Informational | 2 | Three tables with RLS but no policies; RLS unverifiable via service-role tooling |

What is already right is listed under "Controls that hold" at the end. The
baseline is better than these findings suggest: RLS is enabled on all 39
tables with 103 policies, no server secret reaches a client bundle, and the
admin panel is gated in one place.

---

## HIGH-1 — Admin privilege escalation through unverified email signup

**Where:** `app/api/auth/signup/route.ts`, `lib/admin/guard.ts`

`/api/auth/signup` is unauthenticated, uses the **service role**, and creates
accounts with `email_confirm: true`:

```ts
const supabase = createAdminClient();
await supabase.auth.admin.createUser({ email, password, email_confirm: true });
```

Nothing proves the caller owns that address. The route's own comment
acknowledges email is not verified.

Separately, `requireAdmin()` grants admin on **either** condition:

```ts
if (!emailAllowed && (!profile || !profile.is_admin)) redirect("/home");
```

where `emailAllowed` tests `user.email` against the `ADMIN_EMAILS` env
allowlist.

**The chain:** if any address on `ADMIN_EMAILS` does not yet have an account,
anyone can POST that exact address to the public signup route, receive a
confirmed account, sign in, and hold full admin. No mailbox access needed.

Admin is not cosmetic here: `app/admin/actions.ts` calls `createAdminClient()`
in 12 places, which bypasses RLS entirely.

**Exploitable today?** No. `ADMIN_EMAILS` is currently unset, so the allowlist
is empty and only `profiles.is_admin` grants access. The vulnerability arms the
moment that variable is populated, which is precisely when an operator would
reach for it.

**Fix, in order of preference:**

1. Delete the `ADMIN_EMAILS` branch and grant admin solely via
   `profiles.is_admin`. The allowlist adds no capability that a one-row
   database update does not already provide.
2. If it is kept, require a verified email before it can satisfy the check —
   enable "Confirm email" in Supabase, stop passing `email_confirm: true`, and
   test `user.email_confirmed_at` inside `requireAdmin()`.

---

## HIGH-2 — M-Pesa callback authentication is optional

**Where:** `app/api/mpesa/callback/route.ts`

```ts
const expected = process.env.MPESA_CALLBACK_SECRET;
if (expected) {
  const token = new URL(req.url).searchParams.get("t");
  if (token !== expected) return NextResponse.json({ ok: false }, { status: 401 });
}
```

The gate is skipped entirely when the variable is unset — deliberately, "so it
never breaks an existing deployment". The endpoint must be publicly reachable
because Safaricom calls it, and Daraja signs nothing, so this shared secret is
the **only** control available.

With it unset, anyone who learns or guesses a pending `CheckoutRequestID` can
POST a forged `ResultCode: 0` and have the handler mark the payment successful,
activate a paid subscription, or confirm an event ticket that was never paid
for.

Two things limit the blast radius, both by design and worth keeping: the
handler only acts when `pay.status === "pending"`, so replays are inert, and it
only ever touches the booking belonging to that payment's own profile.

**Fix:** make it fail closed. Treat a missing `MPESA_CALLBACK_SECRET` as a
configuration error and reject, rather than waving requests through. Confirm
the variable is set in Vercel before shipping that change, or live callbacks
will start 401-ing.

**Unverified:** whether it is currently set in production. Vercel environment
variables are not readable from here.

---

## MEDIUM-1 — No rate limiting on any endpoint

A search for rate limiting across `app/` and `lib/` returns nothing. Every one
of the 19 route handlers accepts unlimited requests. Three matter:

- **`/api/auth/signup`** — unauthenticated account creation. Trivially
  floodable, and it consumes Supabase auth quota.
- **`/api/mpesa/stkpush` and `/api/events/stkpush`** — each authenticated call
  makes Safaricom send a real STK prompt to a supplied phone number. Without a
  limit this is a harassment vector aimed at arbitrary numbers, and it burns
  Daraja quota.
- **`/api/like`, `/api/pass`, `/api/follow`, `/api/feed`** — scrape and spam
  surface.

**Fix:** per-IP limiting on signup, and per-user limiting on both STK push
routes. The STK routes are the priority because abuse there reaches third
parties who never used the app.

---

## MEDIUM-2 — Account enumeration on signup

`/api/auth/signup` returns HTTP 409 with "That email is already registered"
for existing accounts and 400 for other failures. The status alone reveals
whether any address has a Vibely account. On a dating product, membership is
itself sensitive.

**Fix:** return an identical generic response either way and deliver the
"already registered" hint by email to the address in question.

---

## LOW-1 — Six-character password minimum

`if (password.length < 6)`. No composition or breach check. Raise to at least
10 and consider screening against a compromised-password list.

---

## INFO-1 — Three tables have RLS enabled but no policies

`account_deletions`, `admin_actions`, and `nudges` each have row-level
security enabled and zero policies, so they are unreachable by any browser
client and writable only through the service role.

For `account_deletions` and `admin_actions` that is the correct posture — both
are audit trails written by trusted server code.

`nudges` looks unintentional. If any surface expects a signed-in member to read
their own nudges through the browser client, it will silently return an empty
set rather than erroring. This repository has a documented history of exactly
this failure mode: features that render correctly while their data is
unreachable. Confirm whether `nudges` is read client-side before assuming it is
fine.

---

## INFO-2 — RLS policies cannot be verified with the available tooling

The Supabase tooling used during development authenticates with the
**service role**, which bypasses row-level security by design. It can confirm
that a policy exists in a migration; it cannot confirm the policy actually
restricts anyone.

Every RLS claim in this repository is therefore verified only as far as "the
SQL says so". Policies that matter for confidentiality should be tested as a
signed-in member — two accounts, one reading the other's rows — before being
relied upon. The highest-value targets are `host_payouts` (contains payout
phone numbers), `event_organizer_contacts` (contact details gated on a
confirmed booking), and `messages`.

---

## Controls that hold

Worth recording so nobody weakens them later.

- **RLS everywhere.** All 39 tables enable row-level security, with 103
  policies across 52 migrations. No table was found relying on obscurity.
- **No secret reaches the browser.** Every `"use client"` file was checked for
  non-`NEXT_PUBLIC_` environment references; none were found. The service role
  key is confined to `lib/supabase/admin.ts` and its server-side callers.
- **Admin gated in one place.** `app/admin/layout.tsx` awaits `requireAdmin()`,
  which covers all 11 admin pages by construction. Individual pages do not
  repeat the check, and they do not need to.
- **Admin panel is path-cloaked.** `middleware.ts` returns a bare 404 for
  direct `/admin` hits and serves the panel only through an unguessable base
  path. Defence in depth rather than the control itself, which is correct.
- **Payment confirmation has exactly one writer.** Only the M-Pesa callback can
  move a booking to `confirmed`; the browser is blocked from it by RLS. Held
  seats are deleted when payment fails, so events do not fill with unpaid
  holds. This was confirmed empirically on 21 September 2026: a KSh 500 ticket
  attempt failed on insufficient balance and produced a `failed` payment row
  with no booking.
- **Callback handling is idempotent.** The `status === "pending"` guard makes
  Safaricom's retries inert.
- **Security headers are set.** CSP, HSTS, and `X-Frame-Options` are configured
  in `next.config.mjs`. The CSP is strict enough that it previously blocked a
  Google Fonts import, which is why fonts are self-hosted through `next/font`.
- **Split-at-source limits custodial risk.** Ticket money settles to the host
  directly and the platform retains only its commission, so a compromise of
  this application cannot drain held ticket funds. The trade-off is that
  refunds are not possible from the platform side, which the Terms state
  plainly.

---

## Recommended order of work

1. HIGH-2 — confirm `MPESA_CALLBACK_SECRET` is set in Vercel, then make it
   mandatory. Cheapest fix, and it protects revenue.
2. HIGH-1 — remove the `ADMIN_EMAILS` branch from `requireAdmin()`.
3. MEDIUM-1 — rate limit both STK push routes, then signup.
4. INFO-2 — test `host_payouts` and `event_organizer_contacts` RLS as a real
   signed-in member, with two accounts.
5. MEDIUM-2, LOW-1, INFO-1 — tidy up.
