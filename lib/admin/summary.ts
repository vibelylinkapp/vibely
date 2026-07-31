import { createAdminClient } from "@/lib/supabase/admin";
import { TIER_PRICES, type PaidTier } from "@/lib/tiers";

const DAY_MS = 86400000;
const PAID_TIERS: PaidTier[] = ["plus", "gold", "vip"];

export type AdminSummary = {
  generatedAt: string;
  signups24h: number;
  signups7d: number;
  revenue24h: number;
  revenue7d: number;
  newOrRenewedSubs24h: number;
  activeSubs: number;
  mrr: number;
  openReports: number;
  pendingVerifications: number;
  expiringSoon7d: number;
};

// KES amount with thousands separators, ICU-independent.
export function fmtKes(n: number): string {
  return "KES " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// One-line headline for a push notification body.
export function summaryHeadline(s: AdminSummary): string {
  const parts = [
    `${s.signups24h} new ${s.signups24h === 1 ? "signup" : "signups"}`,
    `${fmtKes(s.revenue24h)} collected`,
    `${s.openReports} open ${s.openReports === 1 ? "report" : "reports"}`,
  ];
  return `Last 24h: ${parts.join(" \u00b7 ")}`;
}

// Computes the admin digest from source-of-truth tables using the
// service-role client. Safe to call from any server context (no web-push).
export async function computeAdminSummary(): Promise<AdminSummary> {
  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const since24 = new Date(now - DAY_MS).toISOString();
  const since7 = new Date(now - 7 * DAY_MS).toISOString();
  const plus7 = new Date(now + 7 * DAY_MS).toISOString();

  const [
    signups24Res,
    signups7Res,
    openReportsRes,
    pendingVerifRes,
    activeSubsRes,
    expiringRes,
    newSubsRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("subscriptions")
      .select("tier")
      .neq("tier", "free")
      .gt("expires_at", nowIso),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .neq("tier", "free")
      .gt("expires_at", nowIso)
      .lte("expires_at", plus7),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .neq("tier", "free")
      .gte("started_at", since24),
  ]);

  const { data: paid } = await admin
    .from("payments")
    .select("amount_kes, created_at")
    .eq("status", "success")
    .gte("created_at", since7);

  let revenue24 = 0;
  let revenue7 = 0;
  (paid ?? []).forEach((p) => {
    revenue7 += p.amount_kes;
    if (p.created_at >= since24) revenue24 += p.amount_kes;
  });

  const tierCounts: Record<PaidTier, number> = { plus: 0, gold: 0, vip: 0 };
  (activeSubsRes.data ?? []).forEach((s) => {
    if (s.tier === "plus" || s.tier === "gold" || s.tier === "vip") {
      tierCounts[s.tier] += 1;
    }
  });
  const activeSubs = PAID_TIERS.reduce((n, t) => n + tierCounts[t], 0);
  const mrr = PAID_TIERS.reduce(
    (sum, t) => sum + tierCounts[t] * TIER_PRICES[t],
    0
  );

  return {
    generatedAt: nowIso,
    signups24h: signups24Res.count ?? 0,
    signups7d: signups7Res.count ?? 0,
    revenue24h: revenue24,
    revenue7d: revenue7,
    newOrRenewedSubs24h: newSubsRes.count ?? 0,
    activeSubs,
    mrr,
    openReports: openReportsRes.count ?? 0,
    pendingVerifications: pendingVerifRes.count ?? 0,
    expiringSoon7d: expiringRes.count ?? 0,
  };
}
