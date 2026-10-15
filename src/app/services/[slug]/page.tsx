import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CatalogShell } from "@/components/CatalogShell";
import { Img } from "@/components/Img";
import { ProductCard } from "@/components/ProductCard";
import { RelatedSearch } from "@/components/RelatedSearch";
import {
  getCategories,
  getServiceBySlug,
  getSettings,
} from "@/lib/data";
import type { PopulatedProduct } from "@/lib/data";
import { buildPageMetadata, DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [service, site] = await Promise.all([
    getServiceBySlug(slug),
    getSettings(),
  ]);
  if (!service) return { title: "Technical services" };
  return buildPageMetadata({
    site,
    title: `${service.title} - Technical Engineering Service in Bangladesh`,
    description: service.shortDescription || service.description,
    path: `/services/${encodeURIComponent(slug)}`,
    image: service.image,
    keywords: [
      service.title,
      `${service.title} Bangladesh`,
      "industrial automation service",
      "machine maintenance Bangladesh",
      "NurShopBD",
    ],
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) redirect("/services");
  const categories = await getCategories("product");
  const related = (service.relatedProducts || []) as unknown as PopulatedProduct[];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription || service.description,
    provider: {
      "@type": "Organization",
      name: "NurShopBD",
      url: DEFAULT_PRODUCTION_DOMAIN,
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    url: `${DEFAULT_PRODUCTION_DOMAIN}/services/${service.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: DEFAULT_PRODUCTION_DOMAIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${DEFAULT_PRODUCTION_DOMAIN}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: `${DEFAULT_PRODUCTION_DOMAIN}/services/${service.slug}`,
      },
    ],
  };

  return (
    <CatalogShell categories={categories}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="overflow-hidden border border-line bg-white">
        {service.image && (
          <div className="relative h-56 md:h-72">
            <Img
              src={service.image}
              alt={service.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-navy/45" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-bright">
                Technical service
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white md:text-4xl">
                {service.title}
              </h1>
            </div>
          </div>
        )}
        <div className="p-6 md:p-8">
          <p className="max-w-2xl text-sm leading-7 text-steel">{service.description}</p>
          {service.features?.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-3">
              {service.features.map((feature) => (
                <li key={feature} className="border border-line bg-paper px-3 py-2 text-sm">
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <Link href={`/contact?service=${service.slug}`} className="btn-orange mt-8 inline-flex">
            Request this service
          </Link>
        </div>
      </article>
      {related.length > 0 && (
        <section>
          <div className="section-label">Related parts</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((item) =>
              item?.slug ? (
                <ProductCard key={String(item._id)} product={item} size="sm" />
              ) : null
            )}
          </div>
        </section>
      )}
      <RelatedSearch currentHref={`/services/${service.slug}`} />
    </CatalogShell>
  );
}
