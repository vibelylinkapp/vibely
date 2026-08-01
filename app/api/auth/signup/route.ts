import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-only, service-role. Creates an email/password account that is
// immediately confirmed, so email sign-up works without waiting on a
// confirmation email. The client then signs in normally to establish the
// session. NOTE: email addresses are therefore NOT verified — phone OTP
// remains the verified path, and this can be tightened later by enabling
// "Confirm email" in Supabase and adding a confirm route.
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
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
    return NextResponse.json(
      {
        error: already
          ? "That email is already registered. Try signing in instead."
          : error.message,
      },
      { status: already ? 409 : 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
