/**
 * Fallback for the {children} slot of the signed-in shell.
 *
 * Kept SHAPE-NEUTRAL on purpose. The previous version mirrored the home
 * feed -- a stories row and a two-column card grid -- so navigating to
 * Messages or Profile flashed a skeleton of a completely different page
 * before the real one arrived, which looked like a rendering fault rather
 * than loading. Generic bars read as "loading" everywhere.
 *
 * No longer 100vh: the tab bar now persists outside this boundary, so a
 * full-height fallback would push it off screen.
 */
export default function AppLoading() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}
    >
      <style>{`
        @keyframes vbShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .vb-sk {
          background-color: #ece9f3;
          background-image: linear-gradient(90deg, #ece9f3 0px, #f6f4fb 200px, #ece9f3 400px);
          background-size: 800px 100%;
          animation: vbShimmer 1.2s infinite linear;
          border-radius: 12px;
        }
        @media (prefers-reduced-motion: reduce) { .vb-sk { animation: none; } }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div className="vb-sk" style={{ width: 120, height: 26 }} />
        <div className="vb-sk" style={{ width: 84, height: 30, borderRadius: 999 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map((i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              className="vb-sk"
              style={{ width: 54, height: 54, borderRadius: "50%", flex: "0 0 auto" }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="vb-sk" style={{ width: "58%", height: 14 }} />
              <div className="vb-sk" style={{ width: "34%", height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
