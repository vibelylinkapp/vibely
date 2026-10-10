/**
 * Password policy for email sign-up.
 *
 * Hashing is NOT done here: Supabase Auth (GoTrue) stores passwords as bcrypt
 * hashes and never returns them. Our job is to stop weak passwords reaching
 * it. bcrypt only reads the first 72 bytes, so longer inputs are refused
 * rather than silently truncated.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX_BYTES = 72;

// A short list of the most common passwords that still pass a length check.
const COMMON = new Set([
  "1234567890",
  "12345678910",
  "0123456789",
  "qwertyuiop",
  "password12",
  "password123",
  "password1234",
  "iloveyou123",
  "1q2w3e4r5t",
  "qwerty12345",
  "abcdefghij",
  "abc1234567",
  "kenya12345",
  "nairobi123",
  "vibely1234",
  "vibely12345",
  "letmein123",
  "welcome123",
  "admin12345",
  "aaaaaaaaaa",
]);

/** Returns a human-readable problem, or null when the password is acceptable. */
export function passwordProblem(password: string, email?: string): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "Password is too long. Use 72 characters or fewer.";
  }
  const lower = password.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(password)) {
    return "That password is too common. Choose something harder to guess.";
  }
  if (!/[a-z]/i.test(password) || !/[0-9\W_]/.test(password)) {
    return "Use a mix of letters and at least one number or symbol.";
  }
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) {
    return "Your password should not contain your email address.";
  }
  return null;
}
