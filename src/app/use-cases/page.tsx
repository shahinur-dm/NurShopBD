import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell } from "@/components/CatalogShell";
import { RelatedSearch } from "@/components/RelatedSearch";
import { Img } from "@/components/Img";
import { getCategories, getSettings, getUseCases } from "@/lib/data";
import { buildPageMetadata, DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSettings();
  return buildPageMetadata({
    site,
    title: "Industrial Applications & Engineering Case Studies",
    description:
      "Explore industrial automation applications and engineering solutions in Bangladesh: spare parts matching, conveyor control, VFD retrofits, and panel kits from NurShopBD.",
    path: "/use-cases",
    keywords: [
      "industrial use cases Bangladesh",
      "PLC conveyor automation",
      "VFD pump fan retrofit",
      "control panel kit",
      "textile RMG drives",
      "EEE lab bench",
      "NurShopBD",
    ],
  });
}

export default async function UseCasesPage() {
  const [categories, useCases] = await Promise.all([
    getCategories("product"),
    getUseCases(),
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
        name: "Our Services",
        item: `${DEFAULT_PRODUCTION_DOMAIN}/use-cases`,
      },
    ],
  };

  return (
    <CatalogShell categories={categories} showSearch={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <header className="relative overflow-hidden bg-navy p-7 text-white md:p-9">

        <div className="absolute right-0 top-0 h-36 w-36 bg-orange/20 blur-3xl" />
        <p className="kicker text-orange-bright">Company use cases</p>
        <h1 className="mt-4 font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold uppercase leading-[0.95] tracking-[0.04em]">
          Applications, not just a parts list
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
          Categories live in the left sidebar. These notes explain the jobs those
          parts actually do for workshops, factories, textile utilities, panel
          builders and EEE labs in Bangladesh. They are application guidance from
          an engineering desk — not invented client ROI.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {useCases.map((item, index) => (
          <Link
            key={item.slug}
            href={`/use-cases/${item.slug}`}
            className="catalog-card group overflow-hidden"
          >
            <div className="relative h-44 overflow-hidden bg-navy">
              <Img
                src={item.image}
                alt={item.title}
                fill
                className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
              <span className="absolute left-4 top-4 bg-orange px-2 py-0.5 font-display text-xs font-bold text-white">
                0{index + 1}
              </span>
              <p className="absolute bottom-4 left-4 right-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-bright">
                {item.industry}
              </p>
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-bold uppercase leading-tight text-navy group-hover:text-orange">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-steel">{item.summary}</p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange">
                Read application note →
              </p>
            </div>
          </Link>
        ))}
      </div>
      <RelatedSearch currentHref="/use-cases" />
    </CatalogShell>
  );
}
