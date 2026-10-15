import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ISiteSettings } from "@/lib/models";

export const DEFAULT_PRODUCTION_DOMAIN = "https://nurshopbd.net";
export const VERCEL_DOMAIN = "https://nurshopbd.vercel.app";
export const HOMEPAGE_OG_BANNER = `${DEFAULT_PRODUCTION_DOMAIN}/nurshopbd-banner.png`;

export function getDefaultSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    if (envUrl.includes("nurshopbd.xyz")) {
      return DEFAULT_PRODUCTION_DOMAIN;
    }
    const withProto = envUrl.startsWith("http://") || envUrl.startsWith("https://") ? envUrl : `https://${envUrl}`;
    return withProto.replace(/\/$/, "");
  }
  return DEFAULT_PRODUCTION_DOMAIN;
}

export function getCanonicalSiteUrl(): string {
  return DEFAULT_PRODUCTION_DOMAIN;
}

export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      if (host.includes("localhost") || host.includes("127.0.0.1")) {
        return `http://${host}`;
      }
      // Vercel preview or alias domains must always canonicalize to primary production domain
      if (host.includes("nurshopbd.vercel.app")) {
        return DEFAULT_PRODUCTION_DOMAIN;
      }
      if (host.includes("nurshopbd.net")) {
        return DEFAULT_PRODUCTION_DOMAIN;
      }
      const proto = h.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
  } catch {
    // Outside request context / build time
  }
  return getDefaultSiteUrl();
}

export function toAbsoluteUrl(
  pathOrUrl?: string,
  baseUrl: string = DEFAULT_PRODUCTION_DOMAIN
): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  if (!pathOrUrl || typeof pathOrUrl !== "string") {
    return `${cleanBase}/nurshopbd-banner.png`;
  }
  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return `${cleanBase}/nurshopbd-banner.png`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("nurshopbd.xyz")) {
      return trimmed.replace("nurshopbd.xyz", cleanBase.replace(/^https?:\/\//, ""));
    }
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${normalizedPath}`;
}

export function buildPageMetadata({
  site,
  title,
  description,
  path = "/",
  image,
  keywords,
  robots,
  baseUrl = DEFAULT_PRODUCTION_DOMAIN,
}: {
  site: ISiteSettings;
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  robots?: Metadata["robots"];
  baseUrl?: string;
}): Metadata {
  const canonical = `${DEFAULT_PRODUCTION_DOMAIN}${path === "/" ? "" : path}`;
  const desc = description || site.seo?.defaultDescription || site.description;
  const ogImage = image?.trim() ? toAbsoluteUrl(image, baseUrl) : `${DEFAULT_PRODUCTION_DOMAIN}/nurshopbd-banner.png`;
  const brand = site.brandName || "NurShopBD";
  const displayTitle = title.includes(brand) ? title : `${title} | ${brand}`;

  return {
    title: {
      absolute: displayTitle,
    },
    description: desc,
    keywords: keywords?.length ? keywords : site.seo?.keywords || [],
    alternates: { canonical },
    ...(robots ? { robots } : {}),
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
      siteName: brand,
      title: displayTitle,
      description: desc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description: desc,
      images: [ogImage],
    },
  };
}

export function buildProductMetadata({
  site,
  product,
  categoryName,
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
    price?: number;
  };
  categoryName?: string;
}): Metadata {
  const canonical = `${DEFAULT_PRODUCTION_DOMAIN}/products/${product.slug}`;
  const brand = site.brandName || "NurShopBD";
  const categorySuffix = categoryName && categoryName !== "Category" ? ` - ${categoryName}` : "";
  const displayTitle = `${product.name}${categorySuffix} | ${brand}`;


  const rawDesc =
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} at ${brand} in Bangladesh. Genuine industrial machinery, automation components and spare parts with fast nationwide delivery.`;
  const cleanDesc = rawDesc
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  // Use product's exact featured image if available
  const ogImage = product.image?.trim()
    ? toAbsoluteUrl(product.image, DEFAULT_PRODUCTION_DOMAIN)
    : `${DEFAULT_PRODUCTION_DOMAIN}/nurshopbd-banner.png`;

  const dynamicKeywords = [
    product.name,
    `${product.name} Bangladesh`,
    `${product.name} price in Bangladesh`,
    `buy ${product.name} online`,
    ...(product.sku ? [product.sku, `${product.sku} price`] : []),
    ...(product.brand ? [product.brand, `${product.brand} Bangladesh`] : []),
    ...(categoryName ? [categoryName, `${categoryName} Bangladesh`] : []),
    "NurShopBD",
    "industrial machine spare parts Bangladesh",
  ];

  return {
    title: {
      absolute: displayTitle,
    },
    description: cleanDesc,
    keywords: dynamicKeywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
      siteName: brand,
      title: displayTitle,
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
      title: displayTitle,
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
