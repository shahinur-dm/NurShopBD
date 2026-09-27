/**
 * Google Maps URL resolver and embed generator for NUR SHOP BD.
 * Supports:
 * - Google Maps Shareable shortlinks (maps.app.goo.gl / goo.gl/maps)
 * - Standard Google Maps URLs (/place/..., ?q=..., /search/..., @lat,lng)
 * - Valid Google Maps Embed URLs (maps.google.com/maps?q=...&output=embed, /maps/embed?...)
 * - Iframe embed snippets (<iframe src="..." ...>)
 * - Direct coordinates (lat, lng) or structured address search strings
 */

export interface ResolvedMapInfo {
  originalInput: string;
  embedUrl: string;
  shareUrl?: string;
  zoom?: number;
  extractedQuery?: string;
  isShortlink?: boolean;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts URL from iframe string if user pasted an iframe embed code
 */
export function extractUrlFromIframe(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("<iframe") || trimmed.includes("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return trimmed;
}

/**
 * Checks if a URL is a Google Maps shareable short link
 */
export function isGoogleMapsShortLink(url: string): boolean {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    return (
      host === "maps.app.goo.gl" ||
      (host === "goo.gl" && u.pathname.startsWith("/maps"))
    );
  } catch {
    return false;
  }
}

/**
 * Builds standard Google Maps embed URL
 */
export function buildEmbedUrl(query: string, zoom: number = 15): string {
  const cleanQuery = encodeURIComponent(query.trim());
  const safeZoom = Math.min(Math.max(Number(zoom) || 15, 1), 21);
  return `https://maps.google.com/maps?q=${cleanQuery}&t=&z=${safeZoom}&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Extracts coordinates, place name, or search query from a full Google Maps URL
 */
export function extractQueryFromGoogleMapsUrl(urlStr: string): { query?: string; zoom?: number } | null {
  try {
    const rawUrl = extractUrlFromIframe(urlStr);
    
    // Check if it's already an embed URL like https://maps.google.com/maps?q=...&output=embed
    if (rawUrl.includes("output=embed") && rawUrl.includes("q=")) {
      const u = new URL(rawUrl);
      const q = u.searchParams.get("q");
      const z = u.searchParams.get("z");
      if (q) {
        return { query: decodeURIComponent(q), zoom: z ? parseInt(z, 10) : undefined };
      }
    }

    // Check for raw lat,lng string e.g. "23.8041, 90.3667"
    const coordMatch = rawUrl.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
    if (coordMatch) {
      return { query: `${coordMatch[1]},${coordMatch[2]}` };
    }

    // Parse URL
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);

    // 1. Check searchParams: ?q=..., ?ll=..., ?query=..., ?destination=..., ?daddr=...
    const qParam =
      u.searchParams.get("q") ||
      u.searchParams.get("query") ||
      u.searchParams.get("destination") ||
      u.searchParams.get("daddr") ||
      u.searchParams.get("ll");
    if (qParam) {
      const zParam = u.searchParams.get("z");
      return {
        query: qParam,
        zoom: zParam ? parseInt(zParam, 10) : undefined,
      };
    }

    // 2. Check path pattern: /place/PLACE_NAME/@lat,lng,zoom or /place/@lat,lng,zoom
    const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
    const coordsInPathMatch = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);

    if (placeMatch && placeMatch[1]) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      const zoom = coordsInPathMatch && coordsInPathMatch[3] ? Math.round(parseFloat(coordsInPathMatch[3])) : undefined;
      if (coordsInPathMatch && coordsInPathMatch[1] && coordsInPathMatch[2]) {
        return { query: `${placeName}, ${coordsInPathMatch[1]},${coordsInPathMatch[2]}`, zoom };
      }
      return { query: placeName, zoom };
    }

    // 3. Check @lat,lng without /place/ e.g. /@23.8041,90.3667,16z
    if (coordsInPathMatch && coordsInPathMatch[1] && coordsInPathMatch[2]) {
      const zoom = coordsInPathMatch[3] ? Math.round(parseFloat(coordsInPathMatch[3])) : undefined;
      return { query: `${coordsInPathMatch[1]},${coordsInPathMatch[2]}`, zoom };
    }

    // 4. Check /search/QUERY
    const searchMatch = u.pathname.match(/\/search\/([^/@]+)/);
    if (searchMatch && searchMatch[1]) {
      const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
      return { query };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Client/Synchronous parser for map URL or address
 */
export function resolveMapInputSync(
  input: string,
  fallbackAddress?: string,
  defaultZoom: number = 15
): ResolvedMapInfo {
  const trimmed = extractUrlFromIframe(input || "").trim();

  if (!trimmed) {
    if (fallbackAddress && fallbackAddress.trim()) {
      return {
        originalInput: "",
        embedUrl: buildEmbedUrl(fallbackAddress.trim(), defaultZoom),
        extractedQuery: fallbackAddress.trim(),
        zoom: defaultZoom,
        isValid: true,
      };
    }
    return {
      originalInput: "",
      embedUrl: buildEmbedUrl("Mirpur-1, Dhaka, Bangladesh", defaultZoom),
      extractedQuery: "Mirpur-1, Dhaka, Bangladesh",
      zoom: defaultZoom,
      isValid: false,
      error: "No location or map URL provided",
    };
  }

  // If it's already an embed URL with embed?pb= (Google Maps embed iframe API)
  if (trimmed.includes("google.com/maps/embed") && (trimmed.includes("pb=") || trimmed.includes("q="))) {
    return {
      originalInput: trimmed,
      embedUrl: trimmed,
      zoom: defaultZoom,
      isValid: true,
    };
  }

  // If it's a short link, mark it as short link (client needs server to resolve)
  if (isGoogleMapsShortLink(trimmed)) {
    return {
      originalInput: trimmed,
      embedUrl: buildEmbedUrl(fallbackAddress || "Mirpur-1, Dhaka, Bangladesh", defaultZoom),
      shareUrl: trimmed,
      isShortlink: true,
      zoom: defaultZoom,
      isValid: true,
    };
  }

  // Try extracting place or coordinates from standard Google Maps URL
  const extracted = extractQueryFromGoogleMapsUrl(trimmed);
  if (extracted && extracted.query) {
    const zoom = extracted.zoom || defaultZoom;
    return {
      originalInput: trimmed,
      embedUrl: buildEmbedUrl(extracted.query, zoom),
      shareUrl: trimmed,
      zoom,
      extractedQuery: extracted.query,
      isValid: true,
    };
  }

  // If it looks like a general address or query string (e.g. "House 43, Mirpur 1, Dhaka")
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return {
      originalInput: trimmed,
      embedUrl: buildEmbedUrl(trimmed, defaultZoom),
      extractedQuery: trimmed,
      zoom: defaultZoom,
      isValid: true,
    };
  }

  // If it's a generic URL that we couldn't parse
  if (fallbackAddress && fallbackAddress.trim()) {
    return {
      originalInput: trimmed,
      embedUrl: buildEmbedUrl(fallbackAddress.trim(), defaultZoom),
      extractedQuery: fallbackAddress.trim(),
      zoom: defaultZoom,
      isValid: false,
      error: "Could not parse specific location from URL. Using office address instead.",
    };
  }

  return {
    originalInput: trimmed,
    embedUrl: buildEmbedUrl("Mirpur-1, Dhaka, Bangladesh", defaultZoom),
    zoom: defaultZoom,
    isValid: false,
    error: "Invalid Google Maps URL",
  };
}

/**
 * Server-side asynchronous resolver that follows HTTP redirects for short links (maps.app.goo.gl)
 */
export async function resolveGoogleMapsUrlAsync(
  input: string,
  fallbackAddress?: string,
  zoom: number = 15
): Promise<ResolvedMapInfo> {
  const trimmed = extractUrlFromIframe(input || "").trim();

  if (!trimmed) {
    return resolveMapInputSync("", fallbackAddress, zoom);
  }

  if (isGoogleMapsShortLink(trimmed)) {
    try {
      const cleanUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const res = await fetch(cleanUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const finalUrl = res.url || "";
      const html = await res.text().catch(() => "");

      // Look for destination URL in finalUrl or inside HTML meta tags
      let targetUrl = finalUrl;

      if (!targetUrl || targetUrl === cleanUrl || targetUrl.includes("maps.app.goo.gl")) {
        // Try parsing canonical / og:url / meta refresh / link href from html
        const metaMatch =
          html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:url["']/i) ||
          html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ||
          html.match(/url=(https?:\/\/[^"'>\s]+)/i);

        if (metaMatch && metaMatch[1]) {
          targetUrl = metaMatch[1];
        }
      }

      // Also search html for coordinate patterns if targetUrl is generic
      const extracted = extractQueryFromGoogleMapsUrl(targetUrl);
      if (extracted && extracted.query) {
        const resolvedZoom = extracted.zoom || zoom;
        return {
          originalInput: trimmed,
          shareUrl: trimmed,
          embedUrl: buildEmbedUrl(extracted.query, resolvedZoom),
          extractedQuery: extracted.query,
          zoom: resolvedZoom,
          isValid: true,
        };
      }

      // Check for coordinates embedded in html json payload
      const htmlCoordMatch = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
      if (htmlCoordMatch && htmlCoordMatch[1] && htmlCoordMatch[2]) {
        const coords = `${htmlCoordMatch[1]},${htmlCoordMatch[2]}`;
        return {
          originalInput: trimmed,
          shareUrl: trimmed,
          embedUrl: buildEmbedUrl(coords, zoom),
          extractedQuery: coords,
          zoom,
          isValid: true,
        };
      }

      // If we got a redirected URL like https://www.google.com/maps/...
      if (targetUrl && (targetUrl.includes("google.com/maps") || targetUrl.includes("maps.google.com"))) {
        const queryExtracted = extractQueryFromGoogleMapsUrl(targetUrl);
        if (queryExtracted?.query) {
          return {
            originalInput: trimmed,
            shareUrl: trimmed,
            embedUrl: buildEmbedUrl(queryExtracted.query, queryExtracted.zoom || zoom),
            extractedQuery: queryExtracted.query,
            zoom: queryExtracted.zoom || zoom,
            isValid: true,
          };
        }
      }
    } catch (err) {
      console.warn("Error following Google Maps shortlink:", err);
    }
  }

  // If not shortlink or shortlink follow failed, use synchronous parser
  return resolveMapInputSync(trimmed, fallbackAddress, zoom);
}
