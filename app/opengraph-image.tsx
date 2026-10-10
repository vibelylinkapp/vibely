import { ImageResponse } from "next/og";

/** Social share card (1200x630) generated at build time for every page. */
export const alt = "Vibely - Meet real people near you in Kenya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #140B26 0%, #3B1270 55%, #7A2FF2 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.85, display: "flex" }}>Vibely</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 24, display: "flex", flexDirection: "column" }}>
          <span>Meet real people</span>
          <span style={{ color: "#FF7A9C" }}>near you.</span>
        </div>
        <div style={{ fontSize: 34, marginTop: 32, opacity: 0.9, display: "flex" }}>
          Dating, friends, hangouts and events across Kenya and East Africa
        </div>
      </div>
    ),
    size
  );
}
