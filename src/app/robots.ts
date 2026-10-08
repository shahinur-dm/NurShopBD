import type { MetadataRoute } from "next";
import { getDefaultSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getDefaultSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
