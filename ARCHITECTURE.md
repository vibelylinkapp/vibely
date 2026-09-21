# Architecture

Vibely is a social discovery product for Kenya and East Africa: profiles,
discovery by interest and proximity, messaging, and paid events.

For the short version see `ARCHITECTURE-ESSENTIALS.md`. For security posture
see `SECURITY-AUDIT.md`.

---

## 1. Stack and deployment

| Concern | Choice |
|---|---|
| Framework | Next.js 15.5.22, App Router, React 19.0.0 |
| Language | TypeScript 5.7 |
| Database, auth, storage, realtime | Supabase (`@supabase/ssr` 0.12.4, `supabase-js` 2.111.0) |
| Hosting | Vercel, auto-deploy from `main` |
| Payments in | M-Pesa Daraja STK push |
| Payments out | Paystack split payments to host M-Pesa |

Production: https://vibely-inky.vercel.app. Supabase project ref
`gimllbqpcytshovqdnfm`. Scripts are only `dev`, `build`, `start` — there is no
test suite and no lint step in CI, so `next build` is the sole gate.

---

## 2. Route structure

```
app/
  page.tsx                  public landing
  about/ terms/ privacy/ safety/    static public pages
  (auth)/sign-in/           email+password and phone OTP
  (app)/                    signed-in surface
    layout.tsx              shared shell, renders the tab bar once
    loading.tsx             shape-neutral Suspense fallback
    error.tsx               recovery boundary
    home/ discover/ nearby/ heatmap/ top-matches/
    matches/ liked-you/ messages/ messages/[id]/
    events/ events/[id]/ plans/ plans/[id]/
    posts/[id]/ u/[id]/ profile/ profile/edit/
    create/ notifications/ onboarding/ verify/ upgrade/ feedback/
  admin/
    layout.tsx              awaits requireAdmin(), gating all 11 pages
    page.tsx analytics/ revenue/ retention/ alerts/ reports/
    verifications/ events/ announcements/ feedback/ paystack-check/
  api/                      19 route handlers
```

### The shared shell

`app/(app)/layout.tsx` renders `{children}` plus a single `<BottomNav />`.

This is load-bearing. Originally there was no group layout: all 22 signed-in
pages rendered the tab bar themselves and `loading.tsx` sat at the group root
with nothing above it. A Suspense fallback replaces everything below its own
boundary, so with no layout in between, every navigation blanked the whole
viewport — tab bar included — and showed a full-height skeleton until the
server finished rendering. That was the reported white flash.

**Do not add `<BottomNav />` to a page.** Routes that should not show it opt out
inside the component: `/onboarding`, `/messages/[id]`, `/events/[id]`. The
early return sits below every hook so hook order cannot vary by route.

`BottomNav` is a client component that builds its Supabase client **inside** its
realtime effect, not during render. Layouts are prerendered; a render-time
`createClient()` would construct a browser client server-side for every signed-in
page and fail the build wherever `NEXT_PUBLIC_SUPABASE_*` is absent.

### Rendering modes

All 22 signed-in pages set `export const dynamic = "force-dynamic"`. Every
navigation is a full server render plus Supabase round trips; there is no
caching or revalidation anywhere. Public marketing and legal pages are static.

---

## 3. Authentication

Three Supabase client factories, and the distinction matters:

| Factory | Key | Use |
|---|---|---|
| `lib/supabase/client.ts` | anon | browser, subject to RLS |
| `lib/supabase/server.ts` | anon, cookie-bound | server components, actions, route handlers; subject to RLS |
| `lib/supabase/admin.ts` | **service role** | trusted server code only; **bypasses RLS** |

`middleware.ts` delegates to `lib/supabase/middleware.ts`, which refreshes the
session cookie on every matched request and cloaks the admin panel.

### Known cost

`updateSession` awaits `supabase.auth.getUser()` on every request, and each
page then calls `getUser()` again — 53 call sites across the codebase.
`getUser()` is a network call to Supabase Auth, not a local token decode, so a
navigation pays at least two sequential auth round trips before any data query
starts.

This is the largest remaining latency item. It is untouched deliberately:
narrowing the middleware matcher risks breaking token refresh on long sessions,
and session expiry has not been tested. Fixing it properly means wrapping the
user lookup in React `cache()` and routing all 53 call sites through it.

### Admin access

`lib/admin/guard.ts` grants admin on **either** `profiles.is_admin` **or** an
email on the `ADMIN_EMAILS` allowlist. The allowlist is an active security
finding (`SECURITY-AUDIT.md`, HIGH-1) because signup does not verify email
ownership.

The panel is path-cloaked: `/admin` returns a bare 404, and the real routes are
served only via the unguessable base path in `lib/admin/path.ts`, rewritten by
middleware. This is defence in depth, not the access control itself.

---

## 4. Data model

39 tables across 52 migrations, 103 RLS policies. **RLS is enabled on every
table.** Files are numbered (`0041_*.sql`) plus a set of earlier dated ones.

Principal groups:

- **Identity** — `profiles`, `profile_intents`, `photos`, `highlights`,
  `verification_requests`, `member_contacts`
- **Graph** — `follows`, `likes`, `passes`, `blocks`, `profile_views`,
  `contact_requests`, `nudges`
- **Content** — `posts`, `post_likes`, `post_comments`, `post_hides`,
  `stories`, `checkins`
- **Messaging** — `conversations`, `conversation_members`, `messages`,
  `message_reactions`
- **Events** — `events`, `event_bookings`, `event_organizer_contacts`
- **Plans** — `plans`, `plan_participants`
- **Money** — `payments`, `subscriptions`, `host_payouts`, `boosts`
- **Ops** — `notifications`, `push_subscriptions`, `reports`, `feedback`,
  `announcements`, `admin_actions`, `account_deletions`

### Two rules that break builds and features

**`lib/database.types.ts` is hand-trimmed, not generated.** Every new column or
table must be added by hand or `next build` fails on a type error.

**Migrations are not run by the pipeline.** Committing SQL changes nothing.
Someone must paste it into the Supabase SQL editor. Code that assumes a new
column will pass review, merge, deploy, and fail in production. The editor also
shows only the last statement's result, so multi-statement scripts should be run
one statement per tab when output matters.

---

## 5. Discovery and matching

- **`lib/discovery.ts`** — ranked, jittered "people near you", and
  `touchLastActive`. Written because nothing in the app ever wrote
  `last_active_at`: ordering by it surfaced the same ten seeded demo accounts
  forever and made all six real members unreachable.
- **`lib/matching.ts`** — IDF-weighted interest matching. Replaced a one-line
  score that had no normalisation, weighted every intent equally, and conflated
  relationship intent with activity interest. A profile that ticked all twelve
  intents scored above 90 percent against everyone. Now interest rarity is
  weighted by `ln(1 + total / (1 + holders))`, scores are union-normalised and
  calibrated to 45–97, null when there is no overlap, and shared interests are
  returned rarest-first so a score can be explained.
- **`nearby_profiles` RPC** — PostGIS radius search. It begins
  `where p.geo is not null`, and every profile had null `geo`, so Nearby
  returned nobody at any radius. Migration 0044 backfills `geo` from the
  declared area with roughly one kilometre of jitter and makes the RPC honour
  `show_location` and exclude banned members.

Both cases were data problems presenting as rendering bugs. Query the table
before reading the component.

---

## 6. Payments

### Money in

`/api/mpesa/stkpush` for subscriptions, `/api/events/stkpush` for tickets.
Both initiate a Daraja STK push and write a `pending` row to `payments`.

`/api/mpesa/callback` is the single writer that resolves a payment. It is
public because Safaricom calls it, guards on `status === "pending"` so retries
are inert, and on success marks the payment, extends the subscription, or
confirms the booking. On failure it deletes the `pending_payment` booking so
events do not fill with unpaid holds.

**Only this callback can confirm a paid booking.** The browser is blocked by
RLS. Verified empirically on 21 September 2026: a KSh 500 ticket attempt failed
on insufficient balance and produced a `failed` payment with no booking row.

Its shared-secret gate is optional and skipped when unset — see
`SECURITY-AUDIT.md`, HIGH-2.

### Money out

Hosts are paid by **Paystack split at collection**, not by a payout batch. The
platform keeps 10 percent (`DEFAULT_COMMISSION_PCT`) and the host's share
settles directly to their M-Pesa. Paystack confirmed M-Pesa as a settlement
destination (`settlement_bank: "MPESA"`), so a host needs only a phone number.

`host_payouts` holds payout details in its own table with owner-only RLS,
deliberately not on `profiles`, whose broad read policy would expose every
host's phone number.

**The consequence is structural: the platform never holds the host's money, so
it cannot refund a ticket.** It can refund only its own commission. Terms
sections 11–16 state this, make the organizer solely liable, and release
organizer contact details to confirmed ticket holders.

### The percentage_charge trap

Paystack's two live documentation sites contradict each other, and disagree on
scale as well. The Subaccount API reference is authoritative:
`percentage_charge` is **the main account's** share, as whole percent. So:

- subaccount `percentage_charge` = **10** (platform)
- transaction `split.subaccounts[].share` = **90** (host)

Opposite framings, both correct. Both derive from `DEFAULT_COMMISSION_PCT` so
they cannot drift. `savePayoutNumber` echoes back the figure Paystack actually
stored, so an inverted split shows up at setup time rather than after real
money moves. Read the comment block in `lib/paystack.ts` before changing either
number.

---

## 7. Feature flags

`lib/features.ts`. Stories, feed, heatmap, top matches, boosts and the chat tab
default **off**. They are built and correct but need population density: with 16
profiles they render as empty shells, and an empty social app reads as dead.
Each is one `NEXT_PUBLIC_FEATURE_*` variable away from returning.

---

## 8. Client-side conventions

`app/globals.css` plus per-surface stylesheets (`home-plus.css`,
`nearby-plus.css`, `discover-plus.css`, `mobile-fixes.css`), all imported in
the root layout. Fonts are self-hosted via `next/font`: the CSP sets
`style-src 'self' 'unsafe-inline'`, which silently blocked the old Google Fonts
`@import` in production.

### One bug to watch for

A percentage width combined with negative margins has broken layout **three
times** — `.sec`, `.pnear-grid2`, and `.pf3-cover`. `width: 100%` resolves
against the content box, so negative side margins shift an element without
widening it, leaving it off-centre. Use `width: auto` when negative margins are
meant to bleed to the edges. Audit any such pairing.

### Modals and backdrop-filter

An element with `backdrop-filter` becomes the containing block for
`position: fixed` descendants. A create-event modal inside the blurred
`.feed-head` had `inset: 0` resolve against the 72px header instead of the
viewport. Modals triggered from blurred containers must portal to
`document.body`.

---

## 9. Time

Event times are stored in UTC and must be rendered in `Africa/Nairobi`.
`lib/format.ts` exports `KE_TZ`; `fmtWhen`, `fmtDate` and `fmtTime` take it
explicitly. Omitting a timezone makes `toLocaleString` use the server zone,
which is UTC on Vercel, and event times render three hours early. That symptom
was once misdiagnosed as a data fault and "fixed" in a migration while the data
was correct all along.

---

## 10. Known gaps

- Two sequential auth round trips per navigation (section 3).
- No caching: 22 pages `force-dynamic`.
- No rate limiting on any endpoint.
- No automated tests; `next build` is the only gate.
- `/discover` still orders by the frozen `last_active_at` pattern that
  `lib/discovery.ts` exists to replace.
- `/discover` and `/nearby` do not surface match scores.
- `nudges` has RLS enabled with no policies, so it is unreadable by browser
  clients.
