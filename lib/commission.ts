// Platform commission on event ticket sales.
//
// The host is paid their share directly by Paystack at the moment of
// collection, so this percentage is the ONLY part of a ticket that ever
// belongs to the platform. Paystack's own transaction fee is borne by the
// platform account (the Paystack default), so it comes out of this cut
// rather than out of the host's money.
export const DEFAULT_COMMISSION_PCT = 10;

/** Resolve the commission for an event, honouring a per-event override. */
export function commissionPctFor(eventCommissionPct: number | null): number {
  const pct =
    eventCommissionPct === null || Number.isNaN(eventCommissionPct)
      ? DEFAULT_COMMISSION_PCT
      : Number(eventCommissionPct);
  // Never allow a split that would leave the subaccount unable to cover
  // Paystack's fee, and never take more than the whole ticket.
  if (pct < 0) return 0;
  if (pct > 50) return 50;
  return pct;
}

/** Split a ticket price into the platform cut and the host's share. */
export function splitTicket(
  priceKes: number,
  eventCommissionPct: number | null
): { commissionKes: number; netToHostKes: number; hostSharePct: number } {
  const pct = commissionPctFor(eventCommissionPct);
  const commissionKes = Math.round((priceKes * pct) / 100);
  return {
    commissionKes,
    netToHostKes: priceKes - commissionKes,
    hostSharePct: 100 - pct,
  };
}
