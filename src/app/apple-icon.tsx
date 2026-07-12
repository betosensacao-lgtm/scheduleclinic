import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A9396",
          borderRadius: 36,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 800, color: "#fff" }}>M</div>
      </div>
    ),
    { ...size },
  );
}
