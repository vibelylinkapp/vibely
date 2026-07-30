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
