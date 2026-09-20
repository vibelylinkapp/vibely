import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Deleting a user needs the service-role key and Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every bucket that stores member-owned files, keyed by <uid>/... prefix. */
const BUCKETS = ["avatars", "post-media", "chat-media", "verifications"];

/** The word a member must type to confirm. Kept in sync with the UI. */
const CONFIRM_PHRASE = "DELETE";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Recursively remove everything under <uid>/ in one bucket.
 *
 * Storage has no "delete folder" call, so we walk it. Depth is capped because
 * a runaway prefix would otherwise loop. Failures are swallowed on purpose:
 * an orphaned file must never block the deletion of the account itself.
 */
async function purgeBucket(
  admin: Admin,
  bucket: string,
  uid: string
): Promise<number> {
  let removed = 0;

  const walk = async (prefix: string, depth: number): Promise<void> => {
    if (depth > 4) return;

    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: 1000 });
    if (error || !data?.length) return;

    // Storage marks folders with a null id.
    const files = data.filter((o) => o.id !== null).map((o) => `${prefix}/${o.name}`);
    const folders = data.filter((o) => o.id === null);

    if (files.length) {
      const { error: rmError } = await admin.storage.from(bucket).remove(files);
      if (!rmError) removed += files.length;
    }
    for (const folder of folders) {
      await walk(`${prefix}/${folder.name}`, depth + 1);
    }
  };

  try {
    await walk(uid, 0);
  } catch {
    // Non-fatal — see above.
  }
  return removed;
}

/**
 * One-way hash of the sign-in identifier. Lets us recognise a previously
 * banned member attempting to return without retaining their phone or email.
 */
function identityHash(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_signed_in" },
      { status: 401 }
    );
  }

  let body: { confirm?: string; reason?: string };
  try {
    body = (await req.json()) as { confirm?: string; reason?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400 }
    );
  }

  // Typed confirmation. Guards against a stray click and against a CSRF-style
  // POST, which could not know to include this.
  if ((body.confirm ?? "").trim().toUpperCase() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { ok: false, error: "confirmation_required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const uid = user.id;

  // Snapshot before anything is destroyed.
  const [{ data: profile }, { count: openReports }] = await Promise.all([
    admin
      .from("profiles")
      .select("display_name, handle, is_banned")
      .eq("id", uid)
      .maybeSingle(),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reported_id", uid)
      .in("status", ["open", "reviewing"]),
  ]);

  const { data: auditRow, error: auditError } = await admin
    .from("account_deletions")
    .insert({
      profile_id: uid,
      display_name: profile?.display_name ?? null,
      handle: profile?.handle ?? null,
      identity_hash: identityHash(user.email ?? user.phone ?? null),
      reason: (body.reason ?? "").trim().slice(0, 500) || null,
      deleted_by: "self",
      was_banned: Boolean(profile?.is_banned),
      open_reports: openReports ?? 0,
    })
    .select("id")
    .single();

  // If we cannot record the deletion we do not perform it. An unlogged
  // deletion is worse than a delayed one.
  if (auditError) {
    return NextResponse.json(
      { ok: false, error: "audit_failed" },
      { status: 500 }
    );
  }

  // Storage first: once the auth user is gone we lose the uid we need here.
  let filesRemoved = 0;
  for (const bucket of BUCKETS) {
    filesRemoved += await purgeBucket(admin, bucket, uid);
  }

  // The real deletion. profiles cascades from auth.users, and everything
  // else cascades from profiles. Payment records, moderation actions and
  // reports are SET NULL by design — see migration 0030.
  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);

  if (deleteError) {
    await admin
      .from("account_deletions")
      .update({ reason: `[FAILED] ${deleteError.message}`.slice(0, 500) })
      .eq("id", auditRow.id);

    return NextResponse.json(
      { ok: false, error: "delete_failed" },
      { status: 500 }
    );
  }

  await admin
    .from("account_deletions")
    .update({
      completed_at: new Date().toISOString(),
      files_removed: filesRemoved,
    })
    .eq("id", auditRow.id);

  // Clear the session cookie so the browser is not left holding a token for
  // a user that no longer exists.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
