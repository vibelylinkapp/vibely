"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type Kind = "selfie" | "national_id" | "passport";

const KIND_LABEL: Record<Kind, string> = {
  selfie: "Selfie only",
  national_id: "Selfie + National ID",
  passport: "Selfie + Passport",
};

export default function VerificationSetup({
  userId,
  verification,
  pending,
  rejectedNote,
}: {
  userId: string;
  verification: "none" | "phone" | "selfie" | "national_id" | "passport";
  pending: boolean;
  rejectedNote: string | null;
}) {
  const router = useRouter();
  const selfieRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("selfie");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified =
    verification === "selfie" ||
    verification === "national_id" ||
    verification === "passport";

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return "Use a JPG, PNG, or WebP image.";
    if (file.size > MAX_BYTES) return "Image must be under 10 MB.";
    return null;
  }

  async function upload(file: File, label: string): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${label}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("verifications")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);
    return path;
  }

  async function submit() {
    setError(null);
    if (!selfie) {
      setError("A selfie is required.");
      return;
    }
    const selfieErr = validate(selfie);
    if (selfieErr) {
      setError(selfieErr);
      return;
    }
    const needsDoc = kind !== "selfie";
    if (needsDoc && !doc) {
      setError("Upload a photo of your ID document.");
      return;
    }
    if (doc) {
      const docErr = validate(doc);
      if (docErr) {
        setError(docErr);
        return;
      }
    }

    setBusy(true);
    try {
      const selfiePath = await upload(selfie, "selfie");
      const docPath = needsDoc && doc ? await upload(doc, "doc") : null;
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("verification_requests")
        .insert({
          profile_id: userId,
          kind,
          selfie_path: selfiePath,
          doc_path: docPath,
        });
      if (dbErr) throw new Error(dbErr.message);
      setBusy(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (isVerified) {
    return (
      <div className="verify-box verified">
        <div className="verify-head">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#FFB020" />
            <path
              d="M7 12.5l3 3 7-7"
              fill="none"
              stroke="#12151D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <strong>Verified</strong>
        </div>
        <span className="sub">Your profile carries the verified badge.</span>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="verify-box">
        <div className="verify-head">
          <strong>Verification under review</strong>
        </div>
        <span className="sub">
          Our team is reviewing your photos. You&apos;ll get the badge once
          approved.
        </span>
      </div>
    );
  }

  return (
    <div className="verify-box">
      <div className="verify-head">
        <strong>Get verified</strong>
      </div>
      <span className="sub">
        Verified members stand out and build trust. Your photos are private and
        only seen by our review team.
      </span>

      {rejectedNote && (
        <p className="verify-rejected">
          Previous attempt wasn&apos;t approved: {rejectedNote}
        </p>
      )}

      <div className="verify-kinds">
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={"verify-kind" + (kind === k ? " active" : "")}
            onClick={() => setKind(k)}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="verify-uploads">
        <button
          type="button"
          className="verify-pick"
          onClick={() => selfieRef.current?.click()}
        >
          {selfie ? `Selfie: ${selfie.name}` : "Upload selfie"}
        </button>
        <input
          ref={selfieRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
        />
        {kind !== "selfie" && (
          <>
            <button
              type="button"
              className="verify-pick"
              onClick={() => docRef.current?.click()}
            >
              {doc
                ? `Document: ${doc.name}`
                : kind === "passport"
                  ? "Upload passport photo"
                  : "Upload National ID photo"}
            </button>
            <input
              ref={docRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
            />
          </>
        )}
      </div>

      {error && <p className="auth-msg">{error}</p>}

      <button
        type="button"
        className="btn"
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 12 }}
      >
        {busy ? "Submitting…" : "Submit for review"}
      </button>
    </div>
  );
}
