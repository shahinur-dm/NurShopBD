import { getSettings } from "@/lib/data";
import { getSiteUrl } from "@/lib/seo";

export async function JsonLd() {
  const site = await getSettings();
  const url = getSiteUrl();
  const brand = site.brandName || "NUR SHOP BD";

  const organization = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Store"],
    "@id": `${url}/#organization`,
    name: brand,
    url,
    logo: site.logoUrl
      ? site.logoUrl.startsWith("http")
        ? site.logoUrl
        : `${url}${site.logoUrl.startsWith("/") ? site.logoUrl : `/${site.logoUrl}`}`
      : `${url}/opengraph-image`,
    email: site.email || "ceo@nurengineering.bd.com",
    telephone: site.phone || "+8801805030940",
    description:
      "Buy machine spare parts, industrial automation equipment, PLC conversion, servo systems, and technical support services in Bangladesh from NUR SHOP BD.",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address || "House#43-44, Road-1, Block-B, Mirpur-1",
      addressLocality: "Dhaka",
      postalCode: "1216",
      addressCountry: "BD",
    },
    sameAs: [
      site.social?.facebook,
      site.social?.linkedin,
      site.social?.youtube,
      site.social?.instagram,
    ].filter(Boolean),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name: brand,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
