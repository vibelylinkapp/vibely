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
