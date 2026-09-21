"use client";

/**
 * Recovery UI for the signed-in area.
 *
 * The app shipped with NO error boundary anywhere. An unhandled throw in
 * any server component therefore produced Next's bare error screen in
 * development and a blank page in production -- a second, separate source
 * of the "white screen" reported by users, and one that left them with no
 * way forward but the browser back button.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        Something went wrong
      </h1>
      <p style={{ color: "#6b6580", lineHeight: 1.55, marginBottom: 20 }}>
        This page failed to load. It is usually temporary, so trying again
        often works.
      </p>
      {error.digest && (
        <p style={{ color: "#9a93ad", fontSize: 12, marginBottom: 20 }}>
          Reference: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "11px 20px",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(90deg,#ff4d8d,#b14cff)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/home"
          style={{
            padding: "11px 20px",
            borderRadius: 999,
            border: "1px solid #e3dff0",
            color: "#3b3550",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
