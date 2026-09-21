# Vibely

Meet real people near you. Dating, friends, hangouts and networking across
Kenya and East Africa.

Live at **https://vibely-inky.vercel.app**

---

## Documentation

| Document | Read it when |
|---|---|
| `ARCHITECTURE-ESSENTIALS.md` | **Start here.** The short version and the six things that will bite you. |
| `ARCHITECTURE.md` | You need detail on routing, auth, data model, payments. |
| `AGENTS.md` | You are about to change code. Operating rules and known traps. |
| `SECURITY-AUDIT.md` | Reviewing security posture or picking up hardening work. |
| `PRD.md` | You need product intent — what exists, what it is for, what is deferred. |

---

## Stack

Next.js 15.5.22 (App Router) with React 19 and TypeScript 5.7. Supabase for
Postgres, auth, storage and realtime. Hosted on Vercel, auto-deploying from
`main`. Payments in via M-Pesa Daraja; host payouts via Paystack split.

---

## Running locally

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill it in, see below
npm run dev                  # http://localhost:3000
```

Scripts are `dev`, `build` and `start`. There is no test suite and no lint step
in CI, so `npm run build` is the only gate before merging.

### Environment

Copy `.env.example` and populate it. The application will not start without the
first two.

**Required**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key, RLS-constrained |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. **Bypasses RLS.** Never expose. |

**Payments**

| Variable | Purpose |
|---|---|
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | Daraja credentials |
| `MPESA_SHORTCODE`, `MPESA_PASSKEY` | STK push identity |
| `MPESA_CALLBACK_SECRET` | Shared secret on the callback URL. **Set this** — the gate is skipped when absent, which lets a forged callback confirm an unpaid ticket. See `SECURITY-AUDIT.md`, HIGH-2. |
| `PAYSTACK_SECRET_KEY` | Host payout subaccounts and split transactions |

**Optional**

| Variable | Purpose |
|---|---|
| `ADMIN_EMAILS` | Comma-separated admin allowlist. **Leaving this unset is currently the safer choice** — see `SECURITY-AUDIT.md`, HIGH-1. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push |
| `CRON_SECRET` | Guards `/api/cron/winback` |
| `NEXT_PUBLIC_FEATURE_*` | Density-dependent surfaces, all default off |

### Feature flags

Stories, the social feed, heatmap, top matches, boosts and the chat tab are
built and correct but default **off**: with 16 profiles they render as empty
shells. Set the matching `NEXT_PUBLIC_FEATURE_*` variable to `1` to bring one
back. See `lib/features.ts`.

---

## Database

39 tables, 52 migrations, 103 RLS policies. Row-level security is enabled on
every table.

**Migrations are applied by hand.** There is no runner in the deploy pipeline.
Committing a file under `supabase/migrations/` changes nothing until it is
pasted into the Supabase SQL editor and run. Code that depends on a new column
will build, merge, deploy, and then fail in production.

The SQL editor only shows the last statement's result, so run one statement per
tab when you need to read the output.

**`lib/database.types.ts` is hand-maintained, not generated.** Every new table
and column must be added there by hand or the build fails on a type error.

---

## Deployment

Pushing to `main` deploys to Vercel.

A merged pull request is **not** a deployed one — Vercel can fail the build
while GitHub shows everything merged. This has happened, and three PRs sat
merged-but-undeployed for hours. To confirm a change is live, fetch a deployed
asset and grep it for a marker from your change.

---

## Contributing

Read `AGENTS.md` before your first change. In particular: always
`git fetch origin main && git reset --hard origin/main` before writing, because
committing from a stale clone has silently reverted merged work three times.
