"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) throw new Error("Forbidden");
  return user.id;
}

export async function dismissReport(reportId: string) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  await admin
    .from("reports")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  await admin
    .from("admin_actions")
    .insert({ admin_id: adminId, action: "dismiss_report", detail: reportId });
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function banUser(
  reportedId: string,
  reportId: string,
  reason: string
) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      is_banned: true,
      is_private: true,
      banned_at: new Date().toISOString(),
      banned_reason: reason,
    })
    .eq("id", reportedId);
  await admin
    .from("reports")
    .update({ status: "actioned", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  await admin
    .from("admin_actions")
    .insert({ admin_id: adminId, target_id: reportedId, action: "ban", detail: reason });
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function approveVerification(
  requestId: string,
  profileId: string,
  kind: "selfie" | "national_id" | "passport"
) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  // Setting profiles.verification flips the generated is_verified flag.
  await admin.from("profiles").update({ verification: kind }).eq("id", profileId);
  await admin
    .from("verification_requests")
    .update({ status: "approved", reviewed_by: adminId, reviewed_at: now })
    .eq("id", requestId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    target_id: profileId,
    action: "approve_verification",
    detail: kind,
  });
  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
}

export async function rejectVerification(
  requestId: string,
  profileId: string,
  note: string
) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("verification_requests")
    .update({ status: "rejected", note, reviewed_by: adminId, reviewed_at: now })
    .eq("id", requestId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    target_id: profileId,
    action: "reject_verification",
    detail: note,
  });
  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
}

export async function deletePost(postId: string, reportId: string) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();

  // Best-effort: remove the media object from the public post-media bucket.
  const { data: post } = await admin
    .from("posts")
    .select("media_url")
    .eq("id", postId)
    .maybeSingle();
  if (post?.media_url) {
    const marker = "/post-media/";
    const at = post.media_url.indexOf(marker);
    if (at >= 0) {
      const path = post.media_url.slice(at + marker.length);
      await admin.storage.from("post-media").remove([path]);
    }
  }

  // Deleting the post cascades its likes and comments.
  await admin.from("posts").delete().eq("id", postId);

  // Resolve any open reports pointing at this post, plus the acted-on report.
  const resolvedAt = new Date().toISOString();
  await admin
    .from("reports")
    .update({ status: "actioned", resolved_at: resolvedAt })
    .eq("post_id", postId)
    .eq("status", "open");
  await admin
    .from("reports")
    .update({ status: "actioned", resolved_at: resolvedAt })
    .eq("id", reportId);

  await admin
    .from("admin_actions")
    .insert({ admin_id: adminId, action: "delete_post", detail: postId });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function approveEvent(eventId: string) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("events")
    .update({
      status: "published",
      rejected_reason: null,
      reviewed_at: now,
      reviewed_by: adminId,
    })
    .eq("id", eventId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    target_id: eventId,
    action: "approve_event",
    detail: eventId,
  });
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function rejectEvent(eventId: string, reason: string) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("events")
    .update({
      status: "rejected",
      is_trending: false,
      rejected_reason: reason || null,
      reviewed_at: now,
      reviewed_by: adminId,
    })
    .eq("id", eventId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    target_id: eventId,
    action: "reject_event",
    detail: reason,
  });
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function toggleFeatureEvent(eventId: string, on: boolean) {
  const adminId = await assertAdmin();
  const admin = createAdminClient();
  await admin.from("events").update({ is_trending: on }).eq("id", eventId);
  await admin.from("admin_actions").insert({
    admin_id: adminId,
    target_id: eventId,
    action: on ? "feature_event" : "unfeature_event",
    detail: eventId,
  });
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}
