import { ImageResponse } from "next/og";

export const alt = "Hector Heredia — Senior Product & Motion Designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0d0d0d",
        color: "#f4f4f4",
        padding: "72px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 32, fontWeight: 600 }}>Hector Heredia</span>
        <span style={{ display: "flex", alignItems: "center", gap: 14, color: "#16e47b", fontSize: 26 }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: "#16e47b" }} />
          Open to work
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 72, lineHeight: 1.03, letterSpacing: "-3px", maxWidth: 980 }}>
          Senior Product &amp; Motion Designer
        </div>
        <div style={{ fontSize: 28, color: "#999", maxWidth: 920 }}>
          Clear, memorable digital experiences across SaaS, AI, Web3, fintech, and real-time 3D.
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#777", fontSize: 22 }}>
        <span>Selected work · 2022—2026</span>
        <span>jherem.vercel.app</span>
      </div>
    </div>,
    size,
  );
}
