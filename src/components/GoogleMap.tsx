"use client";

import { useSite } from "@/components/SiteProvider";
import { resolveMapInputSync, DEFAULT_COMPANY_MAP_QUERY } from "@/lib/google-maps";

export function GoogleMap() {
  const site = useSite();

  const companyPrefix = "Nur Engineering Solution";
  const fullAddress = [
    companyPrefix,
    site.addressHouse ? `House ${site.addressHouse}` : "",
    site.addressRoad ? `Road ${site.addressRoad}` : "",
    site.addressBlock ? `Block ${site.addressBlock}` : "",
    site.address || "",
    site.addressCity || "",
  ]
    .filter(Boolean)
    .join(", ") || DEFAULT_COMPANY_MAP_QUERY;

  const rawUrl = site.mapEmbedUrl || site.mapShareUrl || "";
  const zoom = typeof site.mapZoom === "number" && !isNaN(site.mapZoom) ? site.mapZoom : 17;

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
