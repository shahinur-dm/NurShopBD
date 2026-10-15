import type { Metadata } from "next";
import { CatalogShell } from "@/components/CatalogShell";
import { RelatedSearch } from "@/components/RelatedSearch";
import { Img } from "@/components/Img";
import { getCategories, getCompany, getSettings } from "@/lib/data";
import { buildPageMetadata, DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSettings();
  return buildPageMetadata({
    site,
    title: "About Us — Industrial Machinery & Spare Parts Desk",
    description:
      "Learn about NurShopBD — your trusted engineering partner in Bangladesh for industrial machinery, PLC & HMI automation, servo systems, and genuine machine spare parts.",
    path: "/about",
    keywords: [
      "About NurShopBD",
      "NurShopBD team",
      "industrial engineering Bangladesh",
      "automation parts supplier Dhaka",
    ],
  });
}

export default async function AboutPage() {
  const [categories, company] = await Promise.all([
    getCategories("product"),
    getCompany(),
  ]);

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
        name: "About Us",
        item: `${DEFAULT_PRODUCTION_DOMAIN}/about`,
      },
    ],
  };

  return (
    <CatalogShell categories={categories} showSearch={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {company?.coverImage && (
        <div className="relative h-56 overflow-hidden border border-line md:h-72">
          <Img
            src={company.coverImage}
            alt={company.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-navy/50" />
          <div className="absolute bottom-6 left-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-bright">
              {company?.aboutLabel || "About"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white md:text-4xl">
              {company.name}
            </h1>
          </div>
        </div>
      )}
      <div className="border border-line bg-white p-6 md:p-8">
        <p className="text-sm font-medium capitalize text-orange">{company?.tagline}</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-steel">{company?.about}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border border-line bg-paper p-5">
            <h2 className="font-display text-lg font-bold uppercase text-navy">Mission</h2>
            <p className="mt-2 text-sm leading-6 text-steel">{company?.mission}</p>
          </div>
          <div className="border border-line bg-paper p-5">
            <h2 className="font-display text-lg font-bold uppercase text-navy">Vision</h2>
            <p className="mt-2 text-sm leading-6 text-steel">{company?.vision}</p>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {company?.highlights?.map((item) => (
            <div key={item.label} className="border border-line p-4">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-mist">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-lg font-bold text-navy">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <RelatedSearch currentHref="/about" />
    </CatalogShell>
  );
}
