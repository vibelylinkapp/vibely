"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveEvent,
  rejectEvent,
  toggleFeatureEvent,
} from "@/app/admin/actions";

export default function EventModerationBar({
  eventId,
  status,
  isTrending,
}: {
  eventId: string;
  status: string;
  isTrending: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setErr(null);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="modbar">
      <div className="modbar-row">
        {status !== "published" && (
          <button
            type="button"
            className="mod-btn mod-approve"
            disabled={pending}
            onClick={() => run(() => approveEvent(eventId))}
          >
            Approve
          </button>
        )}
        {status !== "rejected" && (
          <button
            type="button"
            className="mod-btn mod-reject"
            disabled={pending}
            onClick={() => setRejecting((v) => !v)}
          >
            Reject
          </button>
        )}
        <button
          type="button"
          className={"mod-btn" + (isTrending ? " mod-on" : "")}
          disabled={pending || status !== "published"}
          title={
            status !== "published"
              ? "Publish before featuring"
              : isTrending
              ? "Remove from Trending"
              : "Feature in Trending"
          }
          onClick={() => run(() => toggleFeatureEvent(eventId, !isTrending))}
        >
          {isTrending ? "Featured \u2605" : "Feature"}
        </button>
      </div>

      {rejecting && (
        <div className="modbar-reject">
          <input
            className="modal-input"
            placeholder="Reason (shown to the host)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            className="mod-btn mod-reject"
            disabled={pending || !reason.trim()}
            onClick={() =>
              run(async () => {
                await rejectEvent(eventId, reason.trim());
                setRejecting(false);
                setReason("");
              })
            }
          >
            Confirm reject
          </button>
        </div>
      )}

      {err && <p className="auth-msg">{err}</p>}
    </div>
  );
}
