"use client";

import { useState, useTransition } from "react";
import {
  approveVerification,
  rejectVerification,
} from "@/app/admin/actions";
import type { Tables } from "@/lib/database.types";

const KIND_LABEL: Record<string, string> = {
  selfie: "Selfie",
  national_id: "National ID",
  passport: "Passport",
};

export default function VerificationRow({
  request,
  memberName,
  selfieUrl,
  docUrl,
}: {
  request: Tables<"verification_requests">;
  memberName: string;
  selfieUrl: string | null;
  docUrl: string | null;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<null | "approved" | "rejected">(null);

  function onApprove() {
    if (request.kind === "none" || request.kind === "phone") return;
    const kind = request.kind as "selfie" | "national_id" | "passport";
    start(async () => {
      await approveVerification(request.id, request.profile_id, kind);
      setDone("approved");
    });
  }

  function onReject() {
    const note = window.prompt(
      "Reason for rejection (shown to the member):",
      "Photos were unclear — please retake in good lighting."
    );
    if (note === null) return;
    start(async () => {
      await rejectVerification(
        request.id,
        request.profile_id,
        note || "Not approved."
      );
      setDone("rejected");
    });
  }

  if (done) {
    return (
      <div className="verify-card">
        <div className="verify-card-head">
          <strong>{memberName}</strong>
          <span
            className={
              "pill pill-" + (done === "approved" ? "actioned" : "dismissed")
            }
          >
            {done}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-card">
      <div className="verify-card-head">
        <strong>{memberName}</strong>
        <span className="verify-kind-tag">
          {KIND_LABEL[request.kind] ?? request.kind}
        </span>
      </div>

      <div className="verify-imgs">
        {selfieUrl ? (
          <a href={selfieUrl} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selfieUrl} alt="Selfie" />
            <span>Selfie</span>
          </a>
        ) : (
          <div className="verify-img-missing">No selfie</div>
        )}
        {request.kind !== "selfie" &&
          (docUrl ? (
            <a href={docUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={docUrl} alt="Document" />
              <span>Document</span>
            </a>
          ) : (
            <div className="verify-img-missing">No document</div>
          ))}
      </div>

      <div className="row-actions">
        <button disabled={pending} onClick={onApprove}>
          Approve
        </button>
        <button disabled={pending} onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
