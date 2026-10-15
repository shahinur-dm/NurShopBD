import { getSettings } from "@/lib/data";
import { DEFAULT_PRODUCTION_DOMAIN, HOMEPAGE_OG_BANNER } from "@/lib/seo";

export async function JsonLd() {
  const site = await getSettings();
  const brand = site.brandName || "NurShopBD";
  const url = DEFAULT_PRODUCTION_DOMAIN;

  const organization = {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    "@id": `${url}/#organization`,
    name: brand,
    alternateName: ["Nur Shop BD", "Nur Engineering Solution"],
    url,
    logo: site.logoUrl
      ? site.logoUrl.startsWith("http")
        ? site.logoUrl
        : `${url}${site.logoUrl.startsWith("/") ? site.logoUrl : `/${site.logoUrl}`}`
      : HOMEPAGE_OG_BANNER,
    email: site.email || "ceo@nurengineering.bd.com",
    telephone: site.phone || "+8801805030940",
    description:
      "Buy machine spare parts, industrial automation equipment, PLC conversion, servo systems, and technical support services in Bangladesh from NurShopBD.",
    priceRange: "৳৳",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address || "House#43-44, Road-1, Block-B, Mirpur-1",
      addressLocality: "Dhaka",
      postalCode: "1216",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.phone || "+8801805030940",
      contactType: "customer service",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
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
    alternateName: "Nur Shop BD",
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/products?q={search_term_string}`,
      },
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

