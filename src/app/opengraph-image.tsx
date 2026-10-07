import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data";

export const alt = "NUR SHOP BD - Industrial Machinery, PLC Automation & Spare Parts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const site = await getSettings();
  const brand = site.brandName || "NUR SHOP BD";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: "linear-gradient(145deg, #07182b 0%, #0a2540 50%, #123556 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 16,
            background: "#0a2540",
            border: "4px solid #e86a12",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "1px",
          }}
        >
          NUR
        </div>
        <div style={{ marginTop: 28, fontSize: 52, fontWeight: 800, textTransform: "uppercase" }}>
          {brand}
        </div>
        <div style={{ marginTop: 14, fontSize: 24, color: "#f4842f", fontWeight: 600 }}>
          Industrial Machinery, PLC Automation & Spare Parts
        </div>
      </div>
    ),
    { ...size }
  );
}

