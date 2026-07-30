"use client";

import { useState, useTransition } from "react";
import { banUser, dismissReport } from "@/app/admin/actions";
import type { Tables } from "@/lib/database.types";

export default function ReportRow({
  report,
  reportedName,
  reporterName,
  reportedBanned,
}: {
  report: Tables<"reports">;
  reportedName: string;
  reporterName: string;
  reportedBanned: boolean;
}) {
  const [pending, start] = useTransition();
  const [banned, setBanned] = useState(reportedBanned);
  const [status, setStatus] = useState(report.status);

  function onBan() {
    if (!report.reported_id) return;
    const rid = report.reported_id;
    start(async () => {
      await banUser(rid, report.id, report.reason);
      setBanned(true);
      setStatus("actioned");
    });
  }

  function onDismiss() {
    start(async () => {
      await dismissReport(report.id);
      setStatus("dismissed");
    });
  }

  return (
    <tr>
      <td>
        {reportedName}
        {banned && <span className="pill-banned">Banned</span>}
      </td>
      <td>{report.reason}</td>
      <td className="muted">{report.detail ?? "-"}</td>
      <td className="muted">{reporterName}</td>
      <td>
        <span className={"pill pill-" + status}>{status}</span>
      </td>
      <td>
        {status === "open" ? (
          <div className="row-actions">
            <button disabled={pending} onClick={onBan}>
              Ban user
            </button>
            <button disabled={pending} onClick={onDismiss}>
              Dismiss
            </button>
          </div>
        ) : (
          <span className="muted">-</span>
        )}
      </td>
    </tr>
  );
}
