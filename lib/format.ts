// Compact number formatting for counts shown across the UI — likes, comments,
// followers/following, and event "going" counts. Keeps big numbers short so
// they fit tight chips and stat strips.
//   999      -> "999"
//   1_234    -> "1.2K"
//   12_000   -> "12K"
//   1_200000 -> "1.2M"
export function compactCount(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
}

// Every event time is stored as timestamptz (UTC) but is always a Kenyan
// wall-clock time to the people reading it. Formatting without an explicit
// timeZone uses the *server's* zone, which is UTC on Vercel -- that is why a
// 17:00 sundowner rendered as "14:00" and a 05:30 hike as "02:30". Pass this
// to every event date/time formatter so the displayed time is the time people
// will actually turn up at.
export const KE_TZ = "Africa/Nairobi";
