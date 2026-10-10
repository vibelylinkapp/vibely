# Security audit

Second full pass: 10 October 2026. Supersedes the 21 September 2026 audit.

Scope: every route handler in `app/api`, every server action, the middleware,
Supabase client factories, all upload components, storage migrations, the
admin panel and the HTTP headers. Findings are grounded in code that was read.

**Performed by an AI agent acting as the security reviewer. It has not been
reviewed by a human penetration tester.** Before handling large volumes of
money or data, commission an external test.

---

## Status of the September findings

| Id | Finding | Status |
|---|---|---|
| HIGH-1 | Admin escalation via `ADMIN_EMAILS` + unverified signup | Fixed. Admin is granted only by `profiles.is_admin`. |
| HIGH-2 | Optional M-Pesa callback secret | Fixed. Fails closed; now also compared in constant time. |
| MEDIUM-1 | No rate limiting | Fixed. Global per-IP limits on every `/api` route plus the STK and signup limits. |
| MEDIUM-2 | Account enumeration on signup | Fixed. Identical response for new and existing emails. |
| LOW-1 | Weak password minimum | Fixed. Full password policy (see below). |
| INFO-1 | Three tables with RLS and no policies | Open. By design for the two audit tables; confirm `nudges`. |
| INFO-2 | RLS not testable with service-role tooling | Open. Test with two real member accounts. |

---

## New findings in this pass, all fixed

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | High | **Open redirect** in `/auth/callback`: `?next=//evil.example` sent a freshly signed-in member off-site. | `safeNextPath()` validation, same as the sign-in page. |
| 2 | High | **Stored XSS vector** in announcements: the admin `link` field accepted `javascript:` URLs and rendered them as `href`. | `safeLink()` on write (server action) and on render (`AdminNotice`). Only `/path` or `http(s)://` allowed. |
| 3 | Medium | **No CSRF protection** on JSON API routes beyond SameSite cookies. | Middleware Origin / Sec-Fetch-Site check on every POST/PUT/PATCH/DELETE to `/api`. The M-Pesa webhook is exempt and uses its own secret. |
| 4 | Medium | **Timing-unsafe secret comparison** for the M-Pesa callback token and cron bearer tokens. | `safeEqual()` / `hasBearer()` using `crypto.timingSafeEqual`. |
| 5 | Medium | **Internal error leakage**: Daraja and Postgres error messages were returned to the browser (`reason: error.message`). | Generic error codes to the client, details logged server-side via `logServerError()`. |
| 6 | Medium | **Unvalidated identifiers** reached queries (like, follow, pass, unlike, unfollow, unpass, event checkout, admin actions, checkout status). | `asUuid()` validation; malformed ids are rejected before any query. |
| 7 | Medium | **File extension from user file name** on 10 upload components (`photo.html` could be stored with an `.html` key). | `extFor()` derives the extension from the validated MIME type. Bucket MIME/size limits remain the server-side control. |
| 8 | Medium | **No idle session expiry**: a stolen cookie stayed valid indefinitely while refresh tokens rotated. | Idle timeout in middleware (`SESSION_IDLE_DAYS`, default 30) using an httpOnly activity cookie. |
| 9 | Low | Supabase auth cookies did not force `Secure`. | Cookies are written with `Secure` (production) and `SameSite=Lax`. |
| 10 | Low | CSP allowed `'unsafe-eval'` in production. | Dev only now. `upgrade-insecure-requests` added in production. |
| 11 | Low | `Permissions-Policy` set `camera=()` and `microphone=()`, which **broke voice notes** in chat and selfie capture. | `camera=(self) microphone=(self) geolocation=(self)`, everything else off. |
| 12 | Low | `X-Powered-By: Next.js` header disclosed the framework. | `poweredByHeader: false`. |
| 13 | Low | API responses were cacheable and indexable. | `Cache-Control: no-store` and `X-Robots-Tag: noindex` on `/api/*`. |
| 14 | Low | LIKE wildcards in the Discover name search let `%` / `_` match everything. | `escapeLike()` and a 60-character cap. |
| 15 | Low | Service-role client could be imported by a client component by mistake. | `import "server-only"` in `lib/supabase/admin.ts` makes that a build error. |
| 16 | Low | Unbounded JSON bodies on signup. | `readJsonObject()` with a 16 KB cap and object-only parsing. |
| 17 | Info | Public `prototype.html` placeholder (84 KB) served from `/public`. | Removed. |

---

## Controls checklist

| Control | Where | Notes |
|---|---|---|
| Rate limiting | `middleware.ts`, `lib/security/rate-limit-edge.ts`, `lib/rate-limit.ts` | Per-IP budgets per route (auth 10/10 min, STK 10/10 min, account delete 5/h, general API 120/min). STK pushes are also capped per member and per phone from the payments table, which holds across instances. For a global limit, back the edge limiter with Upstash/Vercel KV. |
| Input sanitisation | `lib/security/sanitize.ts` | `asUuid`, `cleanText`, `cleanLine`, `safeLink`, `escapeLike`, `isEmail`. React escapes all rendered text; there is no `dangerouslySetInnerHTML` except JSON-LD, which escapes `<`. |
| Password hashing | Supabase Auth (bcrypt) + `lib/security/password.ts` | We never store or log passwords. Policy: 10+ characters, max 72 bytes (bcrypt limit), not a common password, letters plus a number or symbol, must not contain the email name. Also enable "Leaked password protection" in Supabase Auth settings. |
| Environment variables | `.env.example`, `lib/env.ts` | No hard-coded keys anywhere in the repo. Only `NEXT_PUBLIC_*` reaches the browser. |
| CORS | Default same-origin | No route sets `Access-Control-Allow-Origin`, so browsers block cross-origin reads. The CSRF Origin check blocks cross-origin writes. Do not add a wildcard CORS header. |
| SQL / NoSQL injection | supabase-js / PostgREST | All queries are parameterised. The one `.or()` filter string (push match-gate) only interpolates the session user id and a regex-validated UUID. RLS is on every table. |
| Session expiry | `lib/supabase/middleware.ts` | Idle timeout plus Supabase JWT expiry. In Supabase set JWT expiry to 3600 s and keep refresh token rotation and reuse detection on. |
| HTTPS everywhere | `middleware.ts`, HSTS, CSP | 308 redirect from http, HSTS 2 years with preload, `upgrade-insecure-requests`. |
| Security headers | `next.config.mjs` | CSP, HSTS, X-Frame-Options DENY, frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy, COOP, X-Permitted-Cross-Domain-Policies. |
| Regular dependency updates | `.github/dependabot.yml`, `.github/workflows/security.yml` | Weekly Dependabot PRs; CI runs type-check and `npm audit` (high and critical fail) on every push and weekly. |
| Broken authentication | `getUser()` on every protected route and action | Server always validates the session with Supabase, never trusts a decoded cookie. Admin actions re-check `is_admin` on every call. |
| Unauthorised access | RLS + server checks | Payment status only returns the caller's own payment; push notifications require a mutual match; post notifications derive the recipient from the post. |
| Insecure file uploads | Upload components + bucket policies | MIME allow-lists and size caps on every bucket, owner-only folders (`<uid>/...`), extension from MIME, verification images in a private bucket. |
| Data exposure | API responses, error handling | No stack traces or provider errors returned to clients. Account deletion purges storage and keeps only a hashed identifier. |

---

## Operator actions required (cannot be done from code)

1. In Vercel set `MPESA_CALLBACK_SECRET`, `CRON_SECRET`, `ADMIN_PANEL_PATH` (long random value; the default in the repo is public) and `NEXT_PUBLIC_SITE_URL`.
2. In Supabase Auth: enable leaked-password protection, set minimum password length 10, JWT expiry 3600 s, keep refresh-token rotation on.
3. Rotate any key that has ever been pasted into chat, an issue or a commit.
4. Test RLS on `host_payouts`, `event_organizer_contacts` and `messages` with two real member accounts (INFO-2).
5. Run `supabase/migrations/0047_events_december_2026.sql` in the SQL editor.
