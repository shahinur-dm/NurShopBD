import type { MetadataRoute } from "next";
import { getCategories, getProducts, getServices, getUseCases, getBlogPosts } from "@/lib/data";
import { DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = DEFAULT_PRODUCTION_DOMAIN;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/use-cases`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/catalogue`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/user-manual`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const [categories, products, services, useCases, blogPosts] = await Promise.all([
      getCategories("product"),
      getProducts(),
      getServices(),
      getUseCases(),
      getBlogPosts(),
    ]);

    // Product Category pages
    const categoryEntries: MetadataRoute.Sitemap = categories
      .filter((c) => Boolean(c.slug))
      .map((c) => ({
        url: `${base}/products?category=${encodeURIComponent(c.slug.trim())}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));

    // Product detail pages
    const productEntries: MetadataRoute.Sitemap = products
      .filter((p) => Boolean(p.slug))
      .map((p) => {
        const safeSlug = encodeURIComponent(p.slug.trim());
        const lastMod = p.updatedAt
          ? new Date(p.updatedAt)
          : p.createdAt
          ? new Date(p.createdAt)
          : now;
        return {
          url: `${base}/products/${safeSlug}`,
          lastModified: isNaN(lastMod.getTime()) ? now : lastMod,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      });

    // Technical service pages
    const serviceEntries: MetadataRoute.Sitemap = services
      .filter((s) => Boolean(s.slug))
      .map((s) => ({
        url: `${base}/services/${encodeURIComponent(s.slug.trim())}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      }));

    // Industrial use case pages
    const useCaseEntries: MetadataRoute.Sitemap = useCases
      .filter((u) => Boolean(u.slug))
      .map((item) => ({
        url: `${base}/use-cases/${encodeURIComponent(item.slug.trim())}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      }));

    // Blog & technical article pages
    const blogEntries: MetadataRoute.Sitemap = blogPosts
      .filter((b) => Boolean(b.slug))
      .map((post) => {
        const safeSlug = encodeURIComponent(post.slug.trim());
        const lastMod = post.updatedAt
          ? new Date(post.updatedAt)
          : post.createdAt
          ? new Date(post.createdAt)
          : now;
        return {
          url: `${base}/blog/${safeSlug}`,
          lastModified: isNaN(lastMod.getTime()) ? now : lastMod,
          changeFrequency: "monthly" as const,
          priority: 0.75,
        };
      });

    return [
      ...staticEntries,
      ...categoryEntries,
      ...productEntries,
      ...serviceEntries,
      ...useCaseEntries,
      ...blogEntries,
    ];
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    return staticEntries;
  }
}

