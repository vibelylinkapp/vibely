# Working in this repository

Operating notes for AI agents and new contributors. Most of it is scar tissue:
every rule below exists because breaking it cost real time or broke production.

Read `ARCHITECTURE-ESSENTIALS.md` first. Then this.

---

## Non-negotiables

### 1. Sync before you write. Every time.

```bash
git fetch origin main && git reset --hard origin/main
```

Committing from a stale clone has silently reverted merged work **three times**
in this repository. The third time it re-added a prop to a component that no
longer accepted it, broke the type-check on `main`, and three merged pull
requests never deployed. Nobody noticed for hours because every PR showed as
merged.

If you are adding to an existing branch, list open pull requests first so you
do not overwrite someone else's commit.

### 2. A merged PR is not a deployed PR.

Vercel can fail the build while GitHub shows everything merged. To confirm a
change is actually live, fetch the deployed asset and grep it for a marker from
your change — a new CSS class, a new string. Do not report "verified" on the
strength of a merge.

### 3. Migrations do not run themselves.

There is no migration runner in the pipeline. `supabase/migrations/00XX_*.sql`
does nothing until a human pastes it into the Supabase SQL editor. Say
explicitly when a change needs a migration run, and do not claim a feature
works until it has been. The editor shows only the last statement's result, so
ask for one statement per tab when you need to see output.

### 4. `lib/database.types.ts` is hand-maintained.

Not generated. Add every new table and column by hand or `next build` fails.

### 5. Verify the data before blaming the code.

This has been the actual cause more often than not:

- Home showed the same eight faces: nothing ever wrote `last_active_at`.
- Nearby returned nobody at every radius: `profiles.geo` was null for all rows.

Both looked like rendering bugs. Both were empty columns. Conversely
`profile_intents` was fully populated, which is how we knew matching was
genuinely an algorithm problem. Run a count first; it is the cheapest probe
available.

### 6. The service role bypasses RLS.

The Supabase tooling available in development authenticates as the service
role. It can confirm a policy exists; it **cannot** confirm the policy
restricts anyone. Never report an RLS policy as verified on that basis. Ask for
a test with two real signed-in accounts.

### 7. Do not assume which account the user signs in as.

Inferring it from avatar storage paths produced a wrong answer, and admin was
granted to the wrong profile while the user's real account stayed locked out.
Identify the account from something they actually did — a row they wrote, an
error they triggered — not from a heuristic.

---

## Building and verifying

```bash
# in the sandbox clone
[ -d node_modules/next ] || cp -r /home/user/v2/node_modules ./node_modules
npx next build          # requires network access
```

There is no `.env` in the sandbox, only `.env.example`. Anything constructing a
Supabase client **during render** will therefore fail the build with
"Your project's URL and API key are required". That is usually a real bug worth
fixing rather than an environment quirk: it means a client is being built
server-side. Create clients inside effects or request handlers.

`next build` is the only gate. There are no tests and no lint step in CI.

---

## The exclamation-mark escaping artifact

The tooling rewrites `!` as `\!` inside strings written by Python. This has
wasted more time than any other single issue.

- Never write `!=` in a helper script. Use `if not (a == b)`.
- After **every** file write, repair at the byte level:
  `data.replace(bytes([92, 33]), bytes([33]))`.
- To search for text containing `!`, build the literal with `chr(33)`.
- Audit with `grep -c '\\!' file` and expect zero.

String `.replace()` on the text does not reliably fix it. Byte-level repair
does.

---

## Layout and CSS traps

**Percentage width plus negative margins** has broken layout three times
(`.sec`, `.pnear-grid2`, `.pf3-cover`). `width: 100%` resolves against the
content box, so negative side margins shift an element without widening it.
Use `width: auto` when the margins are meant to bleed to the edges.

**`backdrop-filter` creates a containing block** for `position: fixed`
descendants. A modal inside a blurred header had `inset: 0` resolve against the
header, not the viewport. Portal such modals to `document.body`.

**Fixed widths in horizontal rails overflow.** A 190px card plus a 12px gap
needs 392px in a 328px row. Use `flex: 0 0 calc(50% - 16px)`.

---

## Do not reintroduce the white screen

`app/(app)/layout.tsx` renders the tab bar once for the whole signed-in group.
Do not add `<BottomNav />` to a page. A Suspense fallback replaces everything
below its boundary, so a page-level nav means every navigation blanks the
entire viewport. Routes that should hide the bar opt out inside the component,
below every hook.

Keep `loading.tsx` shape-neutral. A skeleton shaped like the home feed appears
on Messages and Profile too, where it reads as a rendering fault.

---

## Timezones

Always pass `KE_TZ` from `lib/format.ts` when formatting an event time. Without
an explicit timezone, `toLocaleString` uses the server zone — UTC on Vercel —
and times render three hours early. This was once misdiagnosed as bad data and
"fixed" with a migration while the stored data was correct.

---

## Money

Read the `percentage_charge` comment block in `lib/paystack.ts` before touching
any split. Paystack's own documentation contradicts itself; the two numbers
(10 for the platform subaccount, 90 for the transaction split share) are
opposite framings of the same commission and both derive from
`DEFAULT_COMMISSION_PCT`. Do not "simplify" them into one value.

Remember that split-at-source means the platform never holds the host's money
and therefore cannot refund a ticket. Any feature implying otherwise
contradicts Terms sections 11–16.

---

## Cost discipline

The owner has repeatedly and correctly objected to credits burned on
speculative work. Diagnose with cheap probes before writing code:

- `grep` and `find` across the repo cost almost nothing and have located most
  root causes in this project.
- A single `count(*)` often settles whether a bug is data or logic.
- Read the one file that matters rather than delegating a broad search.

Before a large sweep, say what it will cost and offer a narrower first pass.

---

## Reporting

Say what was verified and how, and say plainly what was not. "Merged" is not
"deployed"; "policy written" is not "policy tested"; "built locally" is not
"working in production". When something rests on an inference — as the Paystack
split percentages still do — label it and name the observation that would
confirm it.
