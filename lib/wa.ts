// Single source of truth for WhatsApp deep links.
//
// Kenyan numbers are habitually saved in local format (07xx xxx xxx), which
// is not valid in a wa.me URL - that needs the country code. This helper had
// been copied into two components and the copies drifted: WhatsAppShare
// normalised the leading zero, WhatsAppAskButton did not. The same saved
// number therefore worked from a profile and produced a dead link from a
// Discover card.
export function waLink(num: string): string {
  let d = (num || "").replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  return "https://wa.me/" + d;
}
