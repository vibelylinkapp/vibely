/**
 * Kenyan mobile number helpers.
 *
 * Numbers used to be stored exactly as typed, so member_contacts holds a mix
 * of "0703201241" and "254703201241". wa.me only accepts the international
 * form, so local-format rows produced dead links. Everything is normalised to
 * 254XXXXXXXXX on write and rendered back as 07XX XXX XXX for display.
 *
 * These are pure functions, kept out of the "use server" module because a
 * server-action file may only export async functions.
 */

/** Normalise to E.164 digits (254XXXXXXXXX), or null if not a valid KE mobile. */
export function normaliseKeNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let local: string;
  if (digits.startsWith("254")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;

  // Kenyan mobile subscriber numbers are 9 digits and begin with 7 or 1.
  if (!/^[71]\d{8}$/.test(local)) return null;
  return "254" + local;
}

/** Render 254712345678 as "0712 345 678" so the input box reads naturally. */
export function forDisplay(stored: string | null): string {
  if (!stored) return "";
  const d = stored.replace(/\D/g, "");
  const local = d.startsWith("254") ? d.slice(3) : d.replace(/^0/, "");
  if (!/^[71]\d{8}$/.test(local)) return stored;
  return "0" + local.slice(0, 3) + " " + local.slice(3, 6) + " " + local.slice(6);
}
