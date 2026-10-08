import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogShell } from "@/components/CatalogShell";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailOrderButton } from "@/components/ProductDetailOrderButton";
import { RelatedSearch } from "@/components/RelatedSearch";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductTabs } from "@/components/ProductTabs";
import { getProductDetail } from "@/lib/product-details";
import { getProductMedia } from "@/lib/product-media";
import {
  getCategories,
  getProductBySlug,
  getRelatedProducts,
  getSettings,
} from "@/lib/data";
import { buildProductMetadata, getSiteUrl, toAbsoluteUrl, HOMEPAGE_OG_BANNER } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, site] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
  ]);
  if (!product) return { title: "Product Not Found" };
  return buildProductMetadata({ site, product });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const extra = getProductDetail(product.slug);
  const categoryId =
    typeof product.category === "object"
      ? String(product.category._id)
      : String(product.category);
  const categorySlug =
    typeof product.category === "object" ? product.category.slug : undefined;
  const categoryName =
    typeof product.category === "object" ? product.category.name : "Category";

  const [categories, related, siteSettings] = await Promise.all([
    getCategories("product"),
    getRelatedProducts(categoryId, product.slug, 15),
    getSettings(),
  ]);

  const phone = siteSettings?.social?.whatsapp || siteSettings?.phone || "+8801713798987";
  const cleanPhone = phone.replace(/[^\d]/g, "");

  const hasPrice =
    product.price !== undefined &&
    product.price !== null &&
    !isNaN(Number(product.price)) &&
    Number(product.price) > 0;

  const siteUrl = getSiteUrl();
  const productAbsoluteImage = product.image
    ? toAbsoluteUrl(product.image)
    : HOMEPAGE_OG_BANNER;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ||
      product.description ||
      `${product.name} available at ${siteSettings.brandName || "NUR SHOP BD"}`,
    ...(productAbsoluteImage ? { image: [productAbsoluteImage] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),
    ...(categoryName && categoryName !== "Category" && categoryName !== "—"
      ? { category: categoryName }
      : {}),
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: product.currency || "BDT",
      price: hasPrice ? String(product.price) : "0",
      priceValidUntil: "2030-12-31",
      availability:
        product.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteSettings.brandName || "NUR SHOP BD",
        url: siteUrl,
      },
    },
  };

  const media = getProductMedia(
    product.image,
    categorySlug,
    product.gallery,
    product.videoUrl
  );

  const facts = [
    ["Item Name/Model", product.itemNameModel || product.sku || "On quote"],
    ["Brand / class", product.brand || "As quoted"],
    ["Category", categoryName || "—"],
    [
      "Availability",
      product.availabilityText ||
        (product.inStock ? "In stock – confirm lead time" : "Made to order"),
    ],
    ["Delivery time", product.deliveryTime || "2–3 Working Days"],
    ["Condition", product.condition || extra?.condition || "As quoted"],
    ["Packing", product.packing || extra?.packing || "Carton"],
    ["Warranty", product.warranty || extra?.warranty || "As quoted"],
    ["Price", hasPrice ? `${product.currency || "BDT"} ${product.price}` : "On quote"],
  ];

  return (
    <CatalogShell categories={categories} activeSlug={categorySlug}>
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-2">
        <Link href="/" className="transition hover:text-orange">
          Home
        </Link>
        {categorySlug && (
          <>
            <span className="text-slate-400">/</span>
            <Link
              href={`/products?category=${categorySlug}`}
              className="transition hover:text-orange uppercase font-medium"
            >
              {categoryName}
            </Link>
          </>
        )}
        <span className="text-slate-400">/</span>
        <span className="text-navy font-bold uppercase truncate max-w-[260px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Product Details Card */}
      <article className="panel p-3 sm:p-4 md:p-5 bg-white border border-[#e2e8f0] rounded-[4px] shadow-xs">
        <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[1fr_1.12fr] lg:gap-6">
          {/* Left Side: Image / Video Gallery & Trust Badges */}
          <div className="w-full flex flex-col">
            <ProductGallery
              name={product.name}
              images={media.images}
              videoUrl={media.videoUrl}
            />

            {/* Trust & Service Information Badges (2x2) */}
            <div className="mt-3 pt-3 border-t border-[#e2e8f0] grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-[12.5px] font-semibold text-slate-700">
                <svg
                  className="h-4.5 w-4.5 shrink-0 text-[#1ea952]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{product.benefitPoint1 || "100% genuine, authorised stock"}</span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-[12.5px] font-semibold text-slate-700">
                <svg
                  className="h-4.5 w-4.5 shrink-0 text-[#1ea952]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{product.benefitPoint2 || "12-month manufacturer warranty"}</span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-[12.5px] font-semibold text-slate-700">
                <svg
                  className="h-4.5 w-4.5 shrink-0 text-[#1ea952]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>{product.benefitPoint3 || "Nationwide delivery in 2-4 days"}</span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-[12.5px] font-semibold text-slate-700">
                <svg
                  className="h-4.5 w-4.5 shrink-0 text-[#1ea952]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <circle cx="8" cy="15" r="1.5" />
                </svg>
                <span>{product.benefitPoint4 || "Cash on delivery available"}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Product Information & Attributes with Checkmarks */}
          <div className="flex flex-col">
            {/* Category & Availability Status */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-xs font-bold uppercase tracking-wider text-orange">
                {categoryName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7ed] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1ea952]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1ea952]" />
                {product.availabilityText || (product.inStock ? "AVAILABLE" : "MADE TO ORDER")}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="mt-1.5 font-display text-2xl sm:text-[26px] lg:text-[28px] font-bold uppercase leading-tight tracking-wide text-navy">
              {product.name}
            </h1>

            {/* Short Description */}
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
              {product.shortDescription}
            </p>

            {/* Product Price Display */}
            {product.price !== undefined && product.price !== null && !isNaN(Number(product.price)) && Number(product.price) > 0 ? (
              <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-[28px] font-extrabold text-navy tracking-tight">
                  ৳ {Math.round(Number(product.price)).toLocaleString("en-US")}
                </span>
              </div>
            ) : null}

            {/* Action Buttons: Quantity, Ask Price, WhatsApp, Share */}
            <div className="mt-3 border-t border-[#e2e8f0] pt-3">
              <ProductDetailOrderButton
                product={product}
                whatsappPhone={cleanPhone}
              />
              <p className="mt-2 text-xs text-slate-500 leading-normal">
                Indicative price. Confirm variant, coil voltage, I/O type and stock on quote.
              </p>
            </div>

            {/* Specifications / Product Details Table with Small Green Checkmark Icons */}
            <div className="mt-3 border-t border-[#e2e8f0] pt-2">
              <dl className="divide-y divide-[#e2e8f0]">
                {facts.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[8.5rem_1fr] sm:grid-cols-[10.5rem_1fr] gap-2 py-1 text-xs sm:text-[13px] items-center"
                  >
                    <dt className="text-slate-600 font-medium flex items-center gap-1.5">
                      <svg
                        className="h-3.5 w-3.5 text-[#1ea952] shrink-0 stroke-[2.5]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{label}</span>
                    </dt>
                    <dd className="font-semibold text-navy break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Dynamic MORE IN [CATEGORY] Button */}
            {categorySlug && (
              <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                <Link
                  href={`/products?category=${categorySlug}`}
                  className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-[#1a2e4c] text-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider rounded-[2px] transition shadow-xs w-full sm:w-auto text-center"
                >
                  <span>MORE IN {categoryName}</span>
                  <svg className="h-3.5 w-3.5 stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Description / Specifications / Warranty & Returns Tab Section (Below Main Card) */}
      <section className="panel mt-3 sm:mt-4 p-3 sm:p-4 md:p-5 bg-white border border-[#e2e8f0] rounded-[4px] shadow-xs">
        <ProductTabs
          description={product.description || extra?.overview || ""}
          features={extra?.features || []}
          specTable={
            product.specTable && product.specTable.length > 0
              ? product.specTable
              : extra?.specTable || null
          }
          specsList={product.specs || []}
          warranty={product.warranty || extra?.warranty || ""}
          warrantyAndReturns={product.warrantyAndReturns || ""}
          condition={product.condition || extra?.condition || ""}
          packing={product.packing || extra?.packing || ""}
        />
      </section>

      {/* Related Products Section */}
      {related && related.length > 0 && (
        <section className="panel mt-4 sm:mt-5 p-3 sm:p-4 bg-white border border-[#e2e8f0] rounded-[4px] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-1.5 mb-2">
            <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-navy">
              Related Products
            </h2>
            <Link
              href={categorySlug ? `/products?category=${categorySlug}` : "/products"}
              className="text-xs font-semibold text-orange hover:underline uppercase"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 xl:grid-cols-5">
            {related.map((item) => (
              <ProductCard key={String(item._id)} product={item} size="sm" />
            ))}
          </div>
        </section>
      )}
      <RelatedSearch
        currentHref={`/products/${product.slug}`}
        categorySlug={categorySlug}
      />
    </CatalogShell>
  );
}
