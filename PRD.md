# Vibely — product requirements

Status: living document. Last revised 21 September 2026.

Describes what Vibely is, what ships today, and what is deliberately deferred.
For how it is built see `ARCHITECTURE.md`.

---

## 1. Product

Vibely is a social discovery app for Kenya and East Africa. One product covers
four intents that are usually split across separate apps: dating, friendship,
hangouts, and professional networking.

**Positioning:** the easiest way to meet real people near you.

Two deliberate differences from imported dating apps:

- **Intent is explicit.** Members declare what they are looking for, and
  matching respects the difference between wanting a coffee and wanting a
  relationship.
- **Money works the way Kenya works.** M-Pesa is the payment rail for
  subscriptions and event tickets, and event hosts are paid out to M-Pesa. No
  card is required anywhere.

## 2. Users

| Who | Wants | Gets |
|---|---|---|
| **Member** | To meet people nearby without feeling unsafe or spammed | Verified profiles, intent-aware matching, proximity discovery, messaging |
| **Host** | To fill a paid event and be paid reliably | Event listing, ticketing, commission-deducted payout straight to M-Pesa |
| **Operator** | To keep the community safe and watch the numbers | Admin panel: moderation, verification, reports, revenue, retention |

## 3. Shipped

### Identity and safety
- Email/password and phone OTP sign-in; onboarding captures area, intents,
  interests, photos.
- Selfie verification with a badge and an admin review queue.
- Reporting, blocking, banning; a safety score per profile.
- Location sharing is opt-out (`show_location`), and geo is stored with about
  a kilometre of jitter so a member's exact address is never derivable.

### Discovery
- **Home** — feed, people near you, upcoming events.
- **Discover** — browse and filter.
- **Nearby** — PostGIS radius search honouring `show_location` and excluding
  banned members.
- **Matching** — IDF-weighted on shared interests, so a rare shared interest
  counts for more than a near-universal one. Scores are normalised, calibrated
  to 45–97, null when there is no overlap, and shared interests are surfaced
  rarest-first so a score can be explained rather than just displayed.

### Connection
- Likes, passes, follows, "liked you", matches.
- One-to-one messaging with realtime delivery and unread badges.
- WhatsApp handoff: a number is shared only with a match who asks, and only
  after explicit approval. It is never shown on a profile.

### Events
- Hosts create events with a cover, time, place, capacity and price.
- Free tickets are instant. Paid tickets hold a seat as `pending_payment` and
  become real **only** when M-Pesa confirms. The browser cannot confirm a
  booking; RLS prevents it.
- Organizer email and phone are mandatory for paid events and are visible only
  to confirmed ticket holders, the organizer, and admins.
- Admin review queue flags any paid event lacking organizer contact details.

### Money
- **Subscriptions** — tiered, paid by M-Pesa STK push.
- **Tickets** — M-Pesa STK push per ticket.
- **Host payouts** — Paystack split at collection. The platform keeps 10
  percent; the host's share settles directly to their M-Pesa. Hosts need only a
  phone number, no bank account.

### Admin
Dashboard, analytics, revenue, retention, alerts, reports, verifications,
event moderation, announcements, feedback. Gated in one place and served behind
an unguessable base path; a direct `/admin` hit returns 404.

## 4. Decisions worth remembering

### Funds are never held
> "Money settled in vendor's account after deducting certain percent for admin
> purposes, so we won't hold people's funds in any way."

Chosen over holding ticket money and paying hosts later. Consequences accepted
deliberately:

- The platform **cannot refund a ticket** — it only ever holds its own 10
  percent commission.
- The organizer is solely liable for refunds.
- Therefore organizer contact details are mandatory on paid events and are
  released to confirmed ticket holders. Reaching the organizer is the buyer's
  only remedy, so it must work.
- The platform will refund its own commission, release organizer contacts,
  record the dispute, and withhold undispatched payouts.

Stated plainly in Terms sections 11 to 16. **Those terms have not been reviewed
by a lawyer** and carry a visible note saying so; the event and refund sections
should be checked by a Kenyan advocate before being relied on.

### Paystack over raw Daraja for payouts
Raw Daraja STK push collects into a single till and cannot split. Safaricom's
own split product is B2B only, requiring each host to hold a paybill. Paystack
splits to M-Pesa at about 1.5 percent with T+1 settlement and needs only a
phone number from the host. The platform absorbs the gateway fee.

### Density-dependent surfaces default off
Stories, feed, heatmap and top matches are built and correct, but with 16
profiles they render as empty shells, and an empty social app reads as dead —
worse than a small one that works. Each is one environment variable away from
returning.

## 5. Deferred

| Item | Why |
|---|---|
| Group chat | One-to-one first |
| Video or voice calling | WhatsApp handoff covers it |
| Card payments | M-Pesa is the rail that matters here |
| Refunds from the platform | Impossible by design; see section 4 |
| Native apps | Progressive web app first |
| Automated tests | None exist; `next build` is the only gate. A real gap, not a decision to be proud of |

## 6. Open product questions

1. **Ticket refunds still read as unresolved to buyers.** The Terms are honest
   about it, but an unhappy buyer is directed at the organizer. Whether that
   survives contact with a first real dispute is untested.
2. **Rate limiting is absent everywhere.** STK push is the sharp edge: each
   call sends a real prompt to a supplied phone number, which is a harassment
   vector aimed at people who never used the app.
3. **Trust and safety does not scale yet.** Reports and verification are
   entirely manual through the admin queue.
4. **Growth loop is unproven.** WhatsApp sharing is the only viral mechanism
   and has not produced measurable referral traffic.

## 7. Health checks

Running these beats assuming, and each has caught a real bug where the feature
looked correct but its data was empty:

```sql
-- Nearby returns nobody if this is not zero
select count(*) from profiles where geo is null;

-- Paid events with no organizer contact must not be published
select e.id, e.title, e.price_kes
  from events e
  left join event_organizer_contacts c on c.event_id = e.id
 where e.price_kes > 0 and c.event_id is null;

-- Has the paid ticket path ever completed?
select status, count(*) from payments where event_id is not null group by status;
```
