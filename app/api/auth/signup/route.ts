import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, ipRateLimited } from "@/lib/rate-limit";
import { passwordProblem } from "@/lib/security/password";
import { isEmail } from "@/lib/security/sanitize";
import { readJsonObject } from "@/lib/security/request";

// Server-only, service-role. Creates an email/password account that is
// immediately confirmed, so email sign-up works without waiting on a
// confirmation email. The client then signs in normally to establish the
// session. NOTE: email addresses are therefore NOT verified - phone OTP
// remains the verified path. Admin is granted only via profiles.is_admin,
// so an unverified email can never claim admin (see lib/admin/guard.ts).
//
// Hardening (SECURITY-AUDIT.md):
// - MEDIUM-1: per-IP limit, 5 sign-ups per 10 minutes per instance.
// - MEDIUM-2: an already-registered email gets the same success response
//   as a new one, so this route no longer reveals who has an account. The
//   client then signs in; that succeeds only with the right password and
//   otherwise shows the normal "Invalid login credentials" message.
// - LOW-1: password policy in lib/security/password.ts (10+ chars, not a
//   common password, letters plus a number/symbol, max 72 bytes for bcrypt).
//   Supabase Auth stores the password as a bcrypt hash; we never see it again.
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (ipRateLimited(`signup:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await readJsonObject<{ email: string; password: string }>(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !isEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }
  const weak = passwordProblem(password, email);
  if (weak) {
    return NextResponse.json({ error: weak }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const already =
      error.status === 422 || /already|registered|exists/i.test(error.message);
    // Same response as a new account - see MEDIUM-2 above.
    if (already) return NextResponse.json({ ok: true });
    return NextResponse.json(
      { error: "Could not create your account. Please try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
