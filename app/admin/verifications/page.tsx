import { createAdminClient } from "@/lib/supabase/admin";
import VerificationRow from "@/components/admin/VerificationRow";

export const dynamic = "force-dynamic";

export default async function AdminVerifications() {
  const admin = createAdminClient();
  const { data: reqs } = await admin
    .from("verification_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  const list = reqs ?? [];
  const ids = Array.from(new Set(list.map((r) => r.profile_id)));

  const nameMap: Record<string, string> = {};
  if (ids.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    (profs ?? []).forEach((p) => {
      nameMap[p.id] = p.display_name;
    });
  }

  // The verifications bucket is private — mint short-lived signed URLs.
  const signed: Record<string, { selfie: string | null; doc: string | null }> =
    {};
  await Promise.all(
    list.map(async (r) => {
      const s = await admin.storage
        .from("verifications")
        .createSignedUrl(r.selfie_path, 3600);
      let doc: string | null = null;
      if (r.doc_path) {
        const dr = await admin.storage
          .from("verifications")
          .createSignedUrl(r.doc_path, 3600);
        doc = dr.data?.signedUrl ?? null;
      }
      signed[r.id] = { selfie: s.data?.signedUrl ?? null, doc };
    })
  );

  return (
    <div>
      <h1 className="admin-h1">Verifications</h1>

      {list.length === 0 ? (
        <p className="admin-empty">
          No pending verification requests. When a member submits photos, they
          appear here for review.
        </p>
      ) : (
        <div className="verify-queue">
          {list.map((r) => (
            <VerificationRow
              key={r.id}
              request={r}
              memberName={nameMap[r.profile_id] ?? "Unknown"}
              selfieUrl={signed[r.id]?.selfie ?? null}
              docUrl={signed[r.id]?.doc ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
