"use client";

import { useSite } from "@/components/SiteProvider";
import { resolveMapInputSync } from "@/lib/google-maps";

export function GoogleMap() {
  const site = useSite();

  const fullAddress = [
    site.addressHouse ? `House ${site.addressHouse}` : "",
    site.addressRoad ? `Road ${site.addressRoad}` : "",
    site.addressBlock ? `Block ${site.addressBlock}` : "",
    site.address || "",
    site.addressCity || "",
  ]
    .filter(Boolean)
    .join(", ") || "House#43-44, Road-1, Block -B, Mirpur-1 (Beside Shah Ali Thana), Dhaka-1216";

  const rawUrl = site.mapEmbedUrl || site.mapShareUrl || "";
  const zoom = typeof site.mapZoom === "number" && !isNaN(site.mapZoom) ? site.mapZoom : 15;

  const resolved = resolveMapInputSync(rawUrl, fullAddress, zoom);
  const src = resolved.embedUrl;

  return (
    <div className="relative w-full overflow-hidden border border-line bg-paper">
      <iframe
        title={`${site.brandName} location`}
        src={src}
        className="h-72 w-full border-0 md:h-[380px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
