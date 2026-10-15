import type { Metadata } from "next";
import { CatalogShell } from "@/components/CatalogShell";
import { ProductCard } from "@/components/ProductCard";
import { SubCategoryBar } from "@/components/SubCategoryBar";
import { RelatedSearch } from "@/components/RelatedSearch";
import { getCategories, getSubCategories, getProducts, getSettings } from "@/lib/data";
import { buildPageMetadata, DEFAULT_PRODUCTION_DOMAIN } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string; q?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const [site, categories] = await Promise.all([
    getSettings(),
    getCategories("product"),
  ]);

  if (sp.q) {
    return buildPageMetadata({
      site,
      title: `Search: "${sp.q}"`,
      description: `Search results for "${sp.q}" in industrial machine parts and automation catalog at ${site.brandName || "NurShopBD"}.`,
      path: "/products",
      robots: { index: false, follow: true },
    });
  }

  const activeCategory = sp.category
    ? categories.find((c) => c.slug === sp.category)
    : undefined;

  let subName = "";
  if (sp.category && sp.subcategory) {
    const subcategories = await getSubCategories(sp.category);
    const activeSub = subcategories.find((s) => s.slug === sp.subcategory);
    if (activeSub) subName = activeSub.name;
  }

  if (activeCategory) {
    const catTitle = subName
      ? `${subName} - ${activeCategory.name} in Bangladesh`
      : `${activeCategory.name} in Bangladesh`;
    const catDesc =
      activeCategory.description ||
      `Buy genuine ${activeCategory.name} at ${site.brandName || "NurShopBD"} in Bangladesh. Check specifications, technical details, and request price quotes with fast delivery.`;
    const catPath = `/products?category=${encodeURIComponent(activeCategory.slug)}${
      sp.subcategory ? `&subcategory=${encodeURIComponent(sp.subcategory)}` : ""
    }`;

    return buildPageMetadata({
      site,
      title: catTitle,
      description: catDesc,
      path: catPath,
      keywords: [
        activeCategory.name,
        ...(subName ? [subName] : []),
        `${activeCategory.name} Bangladesh`,
        `${activeCategory.name} price in Bangladesh`,
        "NurShopBD",
        "industrial machinery spare parts",
      ],
    });
  }

  return buildPageMetadata({
    site,
    title: "Industrial Machinery, Automation Equipment & Machine Spare Parts",
    description:
      "Browse industrial machinery, PLC & HMI automation, servo systems, VFD inverters, hydraulic pumps, and spare parts at NurShopBD in Bangladesh.",
    path: "/products",
    keywords: [
      "Industrial Machinery Bangladesh",
      "Machine Spare Parts Bangladesh",
      "PLC Automation Equipment",
      "Servo Motors and Drives",
      "Hydraulic Pumps",
      "VFD Inverters",
      "NurShopBD",
    ],
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [categories, subcategories, products, siteSettings] = await Promise.all([
    getCategories("product"),
    sp.category ? getSubCategories(sp.category) : Promise.resolve([]),
    getProducts({
      categorySlug: sp.category,
      subCategorySlug: sp.subcategory,
      q: sp.q,
    }),
    getSettings(),
  ]);

  const activeCategory = categories.find((c) => c.slug === sp.category);
  const activeSubCategory = subcategories.find((s) => s.slug === sp.subcategory);

  const heading = sp.q
    ? `Search results for “${sp.q}”`
    : activeSubCategory
      ? `${activeCategory?.name || ""} → ${activeSubCategory.name}`
      : activeCategory
        ? activeCategory.name
        : "All products";

  // Breadcrumb schema
  const breadcrumbList = {
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
        name: "Products",
        item: `${DEFAULT_PRODUCTION_DOMAIN}/products`,
      },
      ...(activeCategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: activeCategory.name,
              item: `${DEFAULT_PRODUCTION_DOMAIN}/products?category=${activeCategory.slug}`,
            },
          ]
        : []),
      ...(activeSubCategory && activeCategory
        ? [
            {
              "@type": "ListItem",
              position: 4,
              name: activeSubCategory.name,
              item: `${DEFAULT_PRODUCTION_DOMAIN}/products?category=${activeCategory.slug}&subcategory=${activeSubCategory.slug}`,
            },
          ]
        : []),
    ],
  };

  // ItemList schema for rich snippets of product collections
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((prod, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: prod.name,
      url: `${DEFAULT_PRODUCTION_DOMAIN}/products/${prod.slug}`,
    })),
  };

  return (
    <CatalogShell categories={categories} activeSlug={sp.category}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      {/* Horizontal Sub-Category Navigation Bar */}
      {activeCategory && subcategories.length > 0 && (
        <SubCategoryBar
          categorySlug={activeCategory.slug}
          categoryName={activeCategory.name}
          subcategories={subcategories}
          activeSubSlug={sp.subcategory}
        />
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="section-label">{heading}</div>
          {activeCategory?.description && !sp.subcategory && (
            <p className="-mt-2 mb-1 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-steel">
              {activeCategory.description}
            </p>
          )}
        </div>
        <p className="pb-1 font-display text-[12px] uppercase tracking-[0.16em] text-mist shrink-0">
          {String(products.length).padStart(2, "0")} items
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={String(product._id)} product={product} />
        ))}
      </div>

      <RelatedSearch
        currentHref={
          sp.subcategory && sp.category
            ? `/products?category=${sp.category}&subcategory=${sp.subcategory}`
            : sp.category
              ? `/products?category=${sp.category}`
              : "/products"
        }
        categorySlug={sp.category}
        subcategorySlug={sp.subcategory}
      />

      {!products.length && (
        <div className="border border-line bg-white p-8 text-center text-sm text-steel rounded-[2px]">
          <p className="font-bold text-navy text-sm sm:text-base">No parts currently available in this category.</p>
          <p className="mt-1 text-xs text-mist">Try selecting another sub-category or send us an inquiry on our contact page.</p>
        </div>
      )}
    </CatalogShell>
  );
}
