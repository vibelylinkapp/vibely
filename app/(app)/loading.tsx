// Shared instant-loading skeleton for every route in the (app) group.
// Next.js renders this as the Suspense fallback the moment a navigation
// starts, so tapping between tabs feels immediate instead of showing a blank
// screen while the server renders the (force-dynamic) page.
export default function AppLoading() {
  const cards = [0, 1, 2, 3];
  const dots = [0, 1, 2, 3, 4];
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      style={{ maxWidth: 640, margin: "0 auto", padding: 16, minHeight: "100vh" }}
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

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div className="vb-sk" style={{ width: 110, height: 28 }} />
        <div className="vb-sk" style={{ width: 96, height: 32, borderRadius: 999 }} />
      </div>

      {/* Greeting / hero card */}
      <div className="vb-sk" style={{ width: "100%", height: 92, marginBottom: 16 }} />

      {/* Search */}
      <div
        className="vb-sk"
        style={{ width: "100%", height: 48, borderRadius: 999, marginBottom: 22 }}
      />

      {/* Stories row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {dots.map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div className="vb-sk" style={{ width: 62, height: 62, borderRadius: "50%" }} />
            <div className="vb-sk" style={{ width: 44, height: 10 }} />
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="vb-sk" style={{ width: 168, height: 20, marginBottom: 14 }} />

      {/* Card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {cards.map((i) => (
          <div key={i} className="vb-sk" style={{ width: "100%", aspectRatio: "3 / 4" }} />
        ))}
      </div>
    </div>
  );
}
