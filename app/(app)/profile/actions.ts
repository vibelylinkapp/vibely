"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normaliseKeNumber } from "@/lib/phone";

export type SaveNumberResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export async function saveWhatsAppNumber(
  raw: string
): Promise<SaveNumberResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  const trimmed = raw.trim();

  // An empty box means "remove my number".
  if (!trimmed) {
    const { error } = await supabase
      .from("member_contacts")
      .upsert({
        profile_id: user.id,
        whatsapp: null,
        updated_at: new Date().toISOString(),
      })
      .select("whatsapp")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/profile");
    return { ok: true, value: null };
  }

  const normalised = normaliseKeNumber(trimmed);
  if (!normalised) {
    return {
      ok: false,
      error: "That does not look like a Kenyan mobile number. Try 0712 345 678.",
    };
  }

  const { error: writeErr } = await supabase.from("member_contacts").upsert({
    profile_id: user.id,
    whatsapp: normalised,
    updated_at: new Date().toISOString(),
  });

  if (writeErr) return { ok: false, error: writeErr.message };

  // Read the row back. The previous version reported success purely from the
  // absence of a write error, so a row silently filtered out by RLS still
  // rendered "Saved". Only a value we can read back counts as saved.
  const { data: confirmed, error: readErr } = await supabase
    .from("member_contacts")
    .select("whatsapp")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!confirmed || confirmed.whatsapp !== normalised) {
    return {
      ok: false,
      error: "The number did not save. Please try once more.",
    };
  }

  revalidatePath("/profile");
  return { ok: true, value: confirmed.whatsapp };
}
