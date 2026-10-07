import type { Metadata } from "next";
import type { ISiteSettings } from "@/lib/models";

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    if (envUrl.includes("nurshopbd.xyz")) {
      return "https://nurshopbd.net";
    }
    const withProto = envUrl.startsWith("http://") || envUrl.startsWith("https://") ? envUrl : `https://${envUrl}`;
    return withProto.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://nurshopbd.net";
}

export function toAbsoluteUrl(pathOrUrl?: string): string {
  const siteUrl = getSiteUrl();
  if (!pathOrUrl || typeof pathOrUrl !== "string") {
    return `${siteUrl}/opengraph-image`;
  }
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("nurshopbd.xyz")) {
      return trimmed.replace("nurshopbd.xyz", "nurshopbd.net");
    }
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${siteUrl}${normalizedPath}`;
}

export function buildPageMetadata({
  site,
  title,
  description,
  path = "/",
  image,
  keywords,
}: {
  site: ISiteSettings;
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  const url = getSiteUrl();
  const canonical = `${url}${path === "/" ? "" : path}`;
  const desc = description || site.seo?.defaultDescription || site.description;
  const ogImage = toAbsoluteUrl(image);
  const brand = site.brandName || "NUR SHOP BD";

  return {
    title,
    description: desc,
    keywords: keywords?.length ? keywords : site.seo?.keywords || [],
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
      siteName: brand,
      title: `${title} | ${brand}`,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand}`,
      description: desc,
      images: [ogImage],
    },
  };
}

export function buildProductMetadata({
  site,
  product,
}: {
  site: ISiteSettings;
  product: {
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    image?: string;
    sku?: string;
    brand?: string;
  };
}): Metadata {
  const url = getSiteUrl();
  const canonical = `${url}/products/${product.slug}`;
  const brand = site.brandName || "NUR SHOP BD";
  const title = `${product.name} | ${brand}`;
  
  const rawDesc =
    product.shortDescription ||
    product.description ||
    `${product.name} available at ${brand}. Industrial machinery, automation components and spare parts in Bangladesh.`;
  const cleanDesc = rawDesc
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const ogImage = toAbsoluteUrl(product.image);

  return {
    title,
    description: cleanDesc,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
      siteName: brand,
      title,
      description: cleanDesc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDesc,
      images: [ogImage],
    },
  };
}

export function getAnalyticsIds(site?: ISiteSettings | null) {
  return {
    gaId:
      site?.analytics?.gaMeasurementId?.trim() ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
      "",
    searchConsole:
      site?.analytics?.googleSiteVerification?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
      "",
  };
}
