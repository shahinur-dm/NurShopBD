import type { Metadata } from "next";
import { CatalogShell } from "@/components/CatalogShell";
import { DownloadBreadcrumb, DownloadFileList } from "@/components/DownloadFileList";
import { RelatedSearch } from "@/components/RelatedSearch";
import { connectDB } from "@/lib/db";
import { DownloadFile } from "@/lib/models";
import { getCategories, getSettings } from "@/lib/data";
import { buildPageMetadata, DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSettings();
  return buildPageMetadata({
    site,
    title: "Product Catalogues & Technical Specification Sheets",
    description:
      "Download official industrial machinery product catalogues, automation specifications, and technical PDF brochures from NurShopBD in Bangladesh.",
    path: "/catalogue",
    keywords: [
      "machine catalog download Bangladesh",
      "industrial automation catalogue",
      "PLC catalogue PDF",
      "NurShopBD",
    ],
  });
}

export default async function CataloguePage() {
  const [categories, items] = await Promise.all([
    getCategories("product"),
    loadItems(),
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
        name: "Catalogue",
        item: `${DEFAULT_PRODUCTION_DOMAIN}/catalogue`,
      },
    ],
  };

  return (
    <CatalogShell categories={categories} showSearch={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="border-b border-line pb-5">
        <DownloadBreadcrumb current="Catalogue" />
        <h1 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-navy sm:text-3xl">
          Catalogue
        </h1>
        <p className="mt-2 max-w-2xl text-xs text-steel sm:text-sm">
          Download the latest product catalogues uploaded by our team.
        </p>
      </div>
      <DownloadFileList items={items} emptyLabel="No catalogues are available for download yet." />
      <RelatedSearch currentHref="/catalogue" />
    </CatalogShell>
  );
}

async function loadItems() {
  try {
    const db = await connectDB();
    if (!db) return [];
    const docs = await DownloadFile.find({ kind: "catalogue" })
      .sort({ order: 1, createdAt: -1 })
      .lean<Array<{ _id: unknown; title: string; filename: string; size: number }>>();
    return docs.map((doc) => ({
      _id: String(doc._id),
      title: doc.title,
      filename: doc.filename,
      size: doc.size,
      downloadUrl: `/api/downloads/${String(doc._id)}/file`,
    }));
  } catch {
    return [];
  }
}
