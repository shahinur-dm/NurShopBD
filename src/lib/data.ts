import mongoose from "mongoose";
import { cache as reactCache } from "react";
import { connectDB } from "@/lib/mongodb";
import { serialize } from "@/lib/serialize";
import { withCache, invalidateCache, clearAllCache } from "@/lib/cache";
import {
  SiteSettings,
  Category,
  SubCategory,
  Product,
  Service,
  Feature,
  Banner,
  CompanyProfile,
  UseCase,
  BlogPost,
  BlogCategory,
  Brand,
  type ISiteSettings,
  type ICategory,
  type ISubCategory,
  type IProduct,
  type IService,
  type IFeature,
  type IBanner,
  type ICompanyProfile,
  type IUseCase,
  type IBlogPost,
  type IBrand,
} from "@/lib/models";
import { navLinks, useCaseContent } from "@/lib/use-cases";
import { OFFICIAL_CONTACT, officialOrExisting } from "@/lib/official-contact";
import {
  mockCategories,
  mockSubCategories,
  mockSpecialFeatures,
  mockBanners,
  mockServices,
  mockProducts,
  mockBlogCategories,
  mockBlogPosts,
  type IMockBlogCategory,
} from "@/lib/mock-data";

export { invalidateCache, clearAllCache };

export type PopulatedProduct = Omit<IProduct, "category" | "subCategory" | "relatedServices"> & {
  category: ICategory;
  subCategory?: ISubCategory | null;
  relatedServices: IService[];
};

export type PopulatedService = Omit<IService, "category" | "relatedProducts"> & {
  category?: ICategory | null;
  relatedProducts: IProduct[];
};

import { defaultFooterQuickLinks, defaultFooterServices } from "@/lib/footer-defaults";
export { defaultFooterQuickLinks, defaultFooterServices };

export const fallbackSettings: ISiteSettings = {
  _id: "fallback",
  brandName: "NUR SHOP BD",
  companyName: "NUR SHOP BD",
  tagline: "Machine, spare parts and Technical service provider",
  description:
    "EEE-led supplier of PLC, motors, drives, sensors, and industrial spare parts with technical service across Bangladesh.",
  email: OFFICIAL_CONTACT.email,
  phone: OFFICIAL_CONTACT.phone,
  phone2: OFFICIAL_CONTACT.phone2,
  phone3: OFFICIAL_CONTACT.phone3,
  wechatId: OFFICIAL_CONTACT.wechatId,
  address: OFFICIAL_CONTACT.address,
  addressHouse: OFFICIAL_CONTACT.addressHouse,
  addressRoad: OFFICIAL_CONTACT.addressRoad,
  addressBlock: OFFICIAL_CONTACT.addressBlock,
  addressCity: "Mirpur-1, Dhaka-1216, Bangladesh",
  hours: "Sat–Thu 9:00–18:00",
  workingDays: "Saturday – Thursday",
  mapShareUrl: "",
  mapEmbedUrl:
    "https://maps.google.com/maps?q=Nur%20Engineering%20Solution%2C%20House%2043-44%2C%201%20Humayun%20Rd%2C%20Dhaka%201216%2C%20Bangladesh&t=&z=17&ie=UTF8&iwloc=B&output=embed",
  mapZoom: 17,
  contactPage: {
    heading: "Send a part number or photo",
    description: "We reply with options, stock and pricing. Same desk for products and technical service.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
    hoursLabel: "Hours",
    formHeading: "",
    nameLabel: "Name",
    emailFieldLabel: "Email",
    phoneFieldLabel: "Phone",
    companyLabel: "Company / Workshop",
    inquiryTypeLabel: "Inquiry type",
    inquiryOptions: ["Product quote", "Parts sourcing", "Technical service", "Other"],
    subjectLabel: "Subject",
    messageLabel: "Message",
    submitButtonText: "Send inquiry",
    successMessage: "Message received. We will reply shortly.",
    errorMessage: "Failed to send message. Please try again.",
  },
  logoUrl: "",
  footerLogoUrl: "",
  favicon: "",
  notice: "Out of stock products will be delivered within 3–5 days.",
  noticeBn:
    "★ কোন পার্টস স্টকে না থাকলে জরুরী প্রয়োজনে অর্ডার দেওয়ার ০৩ কার্যদিবসের মধ্যে চায়না থেকে আমদানি করে সরবরাহ করা হয় ★",
  noticeBoardSpeed: 50,
  noticeSpeed: 84,
  social: {
    facebook: "https://www.facebook.com/",
    linkedin: "https://www.linkedin.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    whatsapp: OFFICIAL_CONTACT.whatsapp,
  },
  footerQr: {
    wechatQr: "",
    wechatQrLabel: "WECHAT QR SCAN",
    wechatQrEnabled: true,
    whatsappQr: "",
    whatsappQrLabel: "WHATSAPP QR SCAN",
    whatsappQrEnabled: true,
  },
  heroBanners: {
    banner1: "",
    banner2: "",
    banner3: "",
  },
  seo: {
    defaultTitle:
      "NUR SHOP BD | Machine Parts & Technical Service",
    defaultDescription:
      "Buy PLC, motors, VFD, sensors, contactors and industrial spare parts. Technical service from an EEE engineering desk in Bangladesh.",
    keywords: [
      "PLC Bangladesh",
      "machine parts",
      "VFD",
      "motors",
      "sensors",
      "EEE spare parts",
    ],
  },
  analytics: {},
  nav: navLinks,
  footerQuickLinks: defaultFooterQuickLinks,
  footerServices: defaultFooterServices,
};

function getMockPopulatedProducts(): PopulatedProduct[] {
  const catMap = new Map(mockCategories.map((c) => [String(c._id), c]));
  const subMap = new Map(mockSubCategories.map((s) => [String(s._id), s]));
  const svcMap = new Map(mockServices.map((s) => [String(s._id), s]));
  return mockProducts.map((p) => ({
    ...p,
    category:
      catMap.get(String(p.category)) ||
      mockCategories[0],
    subCategory: p.subCategory ? subMap.get(String(p.subCategory)) || null : null,
    relatedServices: (p.relatedServices || [])
      .map((sid) => svcMap.get(String(sid)))
      .filter(Boolean) as IService[],
  }));
}

function getMockPopulatedServices(): PopulatedService[] {
  const catMap = new Map(mockCategories.map((c) => [String(c._id), c]));
  return mockServices.map((s) => ({
    ...s,
    category: s.category ? catMap.get(String(s.category)) || null : null,
    relatedProducts: [],
  }));
}

export const getSettings = reactCache(async function getSettings(): Promise<ISiteSettings> {
  return withCache("site_settings", async () => {
    let doc: Record<string, unknown> | null = null;
    try {
      const db = await connectDB();
      if (db) {
        const found = await SiteSettings.findOne().sort({ updatedAt: -1 }).lean<ISiteSettings | null>();
        if (found) doc = serialize(found) as unknown as Record<string, unknown>;
      }
    } catch (err) {
      console.warn("getSettings DB warning:", err);
    }

    const merged: Record<string, unknown> = {
      ...fallbackSettings,
      ...(doc || {}),
    };

    const rawSocial = {
      ...fallbackSettings.social,
      ...((doc?.social as Record<string, string>) || {}),
    };

    const rawFooterQr = {
      ...fallbackSettings.footerQr,
      ...((doc?.footerQr as Record<string, unknown>) || {}),
    };

    const rawSeo = {
      ...fallbackSettings.seo,
      ...((doc?.seo as Record<string, unknown>) || {}),
    };

    const rawAnalytics = {
      ...fallbackSettings.analytics,
      ...((doc?.analytics as Record<string, string>) || {}),
    };

    const rawBrandName = (merged.brandName as string) || fallbackSettings.brandName;
    const brandName =
      rawBrandName && /nur\s*engineering(\s*solution)?/i.test(rawBrandName.trim())
        ? "NUR SHOP BD"
        : rawBrandName === "NUR SHOP" || rawBrandName === "Nur Shop"
        ? "NUR SHOP BD"
        : rawBrandName || fallbackSettings.brandName;

    const rawContactPage = {
      ...fallbackSettings.contactPage,
      ...((doc?.contactPage as Record<string, unknown>) || {}),
    };

    return {
      _id: (merged._id as string) || "site-settings",
      brandName,
      companyName: (merged.companyName as string) || brandName,
      tagline: (merged.tagline as string) || fallbackSettings.tagline,
      description: (merged.description as string) || fallbackSettings.description,
      email: officialOrExisting(merged.email as string, fallbackSettings.email),
      phone: officialOrExisting(merged.phone as string, fallbackSettings.phone),
      phone2: officialOrExisting(merged.phone2 as string, fallbackSettings.phone2 || ""),
      phone3: officialOrExisting(merged.phone3 as string | undefined, fallbackSettings.phone3 || ""),
      wechatId: officialOrExisting(merged.wechatId as string, fallbackSettings.wechatId || ""),
      address: officialOrExisting(merged.address as string, fallbackSettings.address),
      addressHouse: officialOrExisting(
        merged.addressHouse as string,
        fallbackSettings.addressHouse || ""
      ),
      addressRoad: officialOrExisting(
        merged.addressRoad as string,
        fallbackSettings.addressRoad || ""
      ),
      addressBlock: officialOrExisting(
        merged.addressBlock as string,
        fallbackSettings.addressBlock || ""
      ),
      addressCity: (merged.addressCity as string) || fallbackSettings.addressCity || "",
      hours: (merged.hours as string) || fallbackSettings.hours,
      workingDays: (merged.workingDays as string) || fallbackSettings.workingDays || "Saturday – Thursday",
      mapShareUrl: (merged.mapShareUrl as string) || "",
      mapEmbedUrl:
        !(merged.mapEmbedUrl as string) ||
        (merged.mapEmbedUrl as string).includes("q=Dhaka%2C%20Bangladesh") ||
        (merged.mapEmbedUrl as string).includes("q=Dhaka&") ||
        (merged.mapEmbedUrl as string).includes("q=Dhaka%2C+Bangladesh")
          ? fallbackSettings.mapEmbedUrl
          : (merged.mapEmbedUrl as string),
      mapZoom: typeof merged.mapZoom === "number" && !isNaN(merged.mapZoom) ? merged.mapZoom : 16,
      contactPage: {
        heading: (rawContactPage.heading as string) || fallbackSettings.contactPage?.heading || "Send a part number or photo",
        description: (rawContactPage.description as string) || fallbackSettings.contactPage?.description || "We reply with options, stock and pricing. Same desk for products and technical service.",
        phoneLabel: (rawContactPage.phoneLabel as string) || "Phone",
        emailLabel: (rawContactPage.emailLabel as string) || "Email",
        addressLabel: (rawContactPage.addressLabel as string) || "Address",
        hoursLabel: (rawContactPage.hoursLabel as string) || "Hours",
        formHeading: (rawContactPage.formHeading as string) || "",
        nameLabel: (rawContactPage.nameLabel as string) || "Name",
        emailFieldLabel: (rawContactPage.emailFieldLabel as string) || "Email",
        phoneFieldLabel: (rawContactPage.phoneFieldLabel as string) || "Phone",
        companyLabel: (rawContactPage.companyLabel as string) || "Company / Workshop",
        inquiryTypeLabel: (rawContactPage.inquiryTypeLabel as string) || "Inquiry type",
        inquiryOptions: Array.isArray(rawContactPage.inquiryOptions) && rawContactPage.inquiryOptions.length
          ? (rawContactPage.inquiryOptions as string[])
          : (fallbackSettings.contactPage?.inquiryOptions || ["Product quote", "Parts sourcing", "Technical service", "Other"]),
        subjectLabel: (rawContactPage.subjectLabel as string) || "Subject",
        messageLabel: (rawContactPage.messageLabel as string) || "Message",
        submitButtonText: (rawContactPage.submitButtonText as string) || "Send inquiry",
        successMessage: (rawContactPage.successMessage as string) || "Message received. We will reply shortly.",
        errorMessage: (rawContactPage.errorMessage as string) || "Failed to send message. Please try again.",
      },
      logoUrl: ((merged.logoUrl || merged.logo) as string) || "",
      footerLogoUrl: (merged.footerLogoUrl as string) || "",
      favicon: (merged.favicon as string) || "",
      notice:
        (merged.notice as string) ||
        fallbackSettings.notice ||
        "Out of stock products will be delivered within 3–5 days.",
      noticeBn:
        (merged.noticeBn as string) ||
        fallbackSettings.noticeBn ||
        "★ কোন পার্টস স্টকে না থাকলে জরুরী প্রয়োজনে অর্ডার দেওয়ার ০৩ কার্যদিবসের মধ্যে চায়না থেকে আমদানি করে সরবরাহ করা হয় ★",
      noticeBoardSpeed:
        typeof merged.noticeBoardSpeed === "number" && !isNaN(merged.noticeBoardSpeed) && merged.noticeBoardSpeed > 0
          ? merged.noticeBoardSpeed
          : (fallbackSettings.noticeBoardSpeed || 50),
      noticeSpeed:
        typeof merged.noticeSpeed === "number" && !isNaN(merged.noticeSpeed) && merged.noticeSpeed > 0
          ? merged.noticeSpeed
          : (fallbackSettings.noticeSpeed || 84),
      social: {
        facebook: rawSocial.facebook || fallbackSettings.social?.facebook || "",
        linkedin: rawSocial.linkedin || fallbackSettings.social?.linkedin || "",
        instagram: rawSocial.instagram || fallbackSettings.social?.instagram || "",
        youtube: rawSocial.youtube || fallbackSettings.social?.youtube || "",
        whatsapp: officialOrExisting(
          rawSocial.whatsapp,
          fallbackSettings.social?.whatsapp || OFFICIAL_CONTACT.whatsapp
        ),
      },
      heroBanners: {
        banner1: ((merged.heroBanners as { banner1?: string } | undefined)?.banner1 as string) || "",
        banner2: ((merged.heroBanners as { banner2?: string } | undefined)?.banner2 as string) || "",
        banner3: ((merged.heroBanners as { banner3?: string } | undefined)?.banner3 as string) || "",
      },
      footerQr: {
        wechatQr: (rawFooterQr.wechatQr as string) || "",
        wechatQrLabel: (rawFooterQr.wechatQrLabel as string) || "WECHAT QR SCAN",
        wechatQrEnabled: rawFooterQr.wechatQrEnabled !== false,
        whatsappQr: (rawFooterQr.whatsappQr as string) || "",
        whatsappQrLabel: (rawFooterQr.whatsappQrLabel as string) || "WHATSAPP QR SCAN",
        whatsappQrEnabled: rawFooterQr.whatsappQrEnabled !== false,
      },
      seo: {
        defaultTitle: (rawSeo.defaultTitle as string) || fallbackSettings.seo.defaultTitle,
        defaultDescription: (rawSeo.defaultDescription as string) || fallbackSettings.seo.defaultDescription,
        keywords: Array.isArray(rawSeo.keywords) ? (rawSeo.keywords as string[]) : fallbackSettings.seo.keywords,
      },
      analytics: {
        gaMeasurementId:
          rawAnalytics.gaMeasurementId ||
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
          "",
        googleSiteVerification:
          rawAnalytics.googleSiteVerification ||
          process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
          "",
      },
      nav: Array.isArray(merged.nav) && merged.nav.length ? (merged.nav as ISiteSettings["nav"]) : fallbackSettings.nav,
      footerQuickLinks:
        Array.isArray(merged.footerQuickLinks) && merged.footerQuickLinks.length
          ? (merged.footerQuickLinks as { label: string; href: string }[])
          : fallbackSettings.footerQuickLinks,
      footerServices:
        Array.isArray(merged.footerServices) && merged.footerServices.length
          ? (merged.footerServices as { label: string; href: string }[])
          : fallbackSettings.footerServices,
    };
  }, 120_000);
});

export const fallbackCompanyProfile: ICompanyProfile = {
  _id: "company-profile",
  name: "NUR SHOP BD",
  tagline: "Machine, spare parts and Technical service provider",
  about:
    "NUR SHOP BD is a Bangladesh-based machine parts and technical service desk founded by an Electrical and Electronic Engineering student. We sell PLC, motors, drives, sensors, contactors and workshop spare parts — and we help you pick the right substitute when the original part is gone.",
  mission:
    "Supply accurate industrial parts with honest specs, clear prices, and EEE-backed selection help.",
  vision:
    "Be the parts partner workshops and small factories in Bangladesh actually call first.",
  aboutLabel: "About",
  foundedYear: 2024,
  email: OFFICIAL_CONTACT.email,
  phone: OFFICIAL_CONTACT.phone,
  address: OFFICIAL_CONTACT.address,
  coverImage: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600&q=80",
  highlights: [
    { label: "Founded", value: "2024" },
    { label: "Focus", value: "EEE machine parts & service" },
    { label: "Based in", value: "Dhaka, Bangladesh" },
    { label: "Catalog", value: "PLC to bearings" },
  ],
};

export const getCompany = reactCache(async function getCompany(): Promise<ICompanyProfile> {
  return withCache("company_profile", async () => {
    let doc: ICompanyProfile | null = null;
    try {
      const db = await connectDB();
      if (db) {
        const found = await CompanyProfile.findOne().lean<ICompanyProfile | null>();
        if (found) doc = serialize(found);
      }
    } catch (err) {
      console.warn("getCompany DB error:", err);
    }

    if (!doc) {
      return fallbackCompanyProfile;
    }

    const rawCompanyName = doc.name || fallbackCompanyProfile.name;
    const companyName =
      rawCompanyName && /nur\s*engineering(\s*solution)?/i.test(rawCompanyName.trim())
        ? "NUR SHOP BD"
        : rawCompanyName === "NUR SHOP" || rawCompanyName === "Nur Shop"
        ? "NUR SHOP BD"
        : rawCompanyName;

    return {
      ...fallbackCompanyProfile,
      ...doc,
      name: companyName,
      aboutLabel: doc.aboutLabel || fallbackCompanyProfile.aboutLabel,
      highlights:
        Array.isArray(doc.highlights) && doc.highlights.length > 0
          ? doc.highlights
          : fallbackCompanyProfile.highlights,
    };
  }, 120_000);
});

export const getCategories = reactCache(async function getCategories(
  type?: "product" | "service"
): Promise<ICategory[]> {
  const cacheKey = `categories_${type || "all"}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const filter: Record<string, unknown> = {};
        if (type === "product") {
          filter.type = "product";
        } else if (type === "service") {
          filter.type = "service";
        }
        const docs = await Category.find(filter)
          .sort({ order: 1, name: 1 })
          .lean<ICategory[]>();
        if (docs && docs.length > 0) {
          return serialize(docs);
        }
      }
    } catch (err) {
      console.error("getCategories DB error:", err);
    }
    const mock = type ? mockCategories.filter((c) => c.type === type) : mockCategories;
    return serialize(mock) as unknown as ICategory[];
  }, 120_000);
});

export const getSubCategories = reactCache(async function getSubCategories(
  categorySlugOrId?: string
): Promise<ISubCategory[]> {
  const cacheKey = `subcategories_${categorySlugOrId || "all"}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const filter: Record<string, unknown> = { published: true };
        if (categorySlugOrId) {
          const allCats = await getCategories("product");
          const cat = allCats.find(
            (c) =>
              c.slug === categorySlugOrId ||
              String(c._id) === categorySlugOrId ||
              c.name.toLowerCase() === categorySlugOrId.replace(/-/g, " ").toLowerCase()
          );
          if (cat) {
            const catObjId = mongoose.Types.ObjectId.isValid(String(cat._id))
              ? new mongoose.Types.ObjectId(String(cat._id))
              : cat._id;
            filter.category = catObjId;
          } else if (mongoose.Types.ObjectId.isValid(categorySlugOrId)) {
            filter.category = new mongoose.Types.ObjectId(categorySlugOrId);
          } else {
            filter.category = categorySlugOrId;
          }
        }
        const docs = await SubCategory.find(filter)
          .sort({ order: 1, name: 1 })
          .lean<ISubCategory[]>();
        if (docs) {
          const allCats = await getCategories("product");
          const catMap = new Map<string, { _id: string; name: string; slug: string }>();
          for (const c of allCats) {
            catMap.set(String(c._id), { _id: String(c._id), name: c.name, slug: c.slug });
            catMap.set(c.slug, { _id: String(c._id), name: c.name, slug: c.slug });
          }
          const populated = docs.map((s) => {
            const parent = typeof s.category === "object" && s.category !== null && "name" in s.category
              ? s.category
              : catMap.get(String(s.category)) || s.category;
            return {
              ...s,
              category: parent,
            };
          });
          return serialize(populated) as unknown as ISubCategory[];
        }
      }
    } catch (err) {
      console.error("getSubCategories DB error:", err);
    }

    let list = mockSubCategories;
    if (categorySlugOrId) {
      const parentMockCat = mockCategories.find(
        (c) => c._id === categorySlugOrId || c.slug === categorySlugOrId
      );
      if (parentMockCat) {
        list = list.filter((s) => String(s.category) === String(parentMockCat._id));
      }
    }
    return serialize(list) as unknown as ISubCategory[];
  }, 120_000);
});

export const getBrands = reactCache(async function getBrands(): Promise<IBrand[]> {
  return withCache("brands_all", async () => {
    try {
      const db = await connectDB();
      if (db) {
        const docs = await Brand.find({ active: true })
          .sort({ order: 1, name: 1 })
          .lean<IBrand[]>();
        if (docs) {
          return serialize(docs);
        }
      }
    } catch (err) {
      console.error("getBrands DB error:", err);
    }
    return [];
  }, 120_000);
});

export const getBanners = reactCache(async function getBanners(): Promise<IBanner[]> {
  return withCache("banners_all", async () => {
    let banners: IBanner[] = serialize(mockBanners);
    try {
      const db = await connectDB();
      if (db) {
        const docs = await Banner.find({ active: true })
          .sort({ order: 1 })
          .lean<IBanner[]>();
        if (docs.length) banners = serialize(docs);
      }
    } catch {
      banners = serialize(mockBanners);
    }

    try {
      const settings = await getSettings();
      const overrides = [
        settings.heroBanners?.banner1,
        settings.heroBanners?.banner2,
        settings.heroBanners?.banner3,
      ];
      banners = banners.map((banner, index) => {
        const image = overrides[index];
        return image ? { ...banner, image } : banner;
      });
    } catch {
      // keep default banner images
    }

    return banners;
  }, 120_000);
});

export const getServices = reactCache(async function getServices(opts?: {
  featured?: boolean;
}): Promise<PopulatedService[]> {
  const cacheKey = `services_${opts?.featured ? "feat" : "all"}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const filter: Record<string, unknown> = { published: true };
        if (opts?.featured) filter.featured = true;
        const docs = await Service.find(filter)
          .populate("category")
          .populate({ path: "relatedProducts", populate: { path: "category" } })
          .sort({ order: 1, _id: 1 })
          .lean<PopulatedService[]>();
        if (docs && docs.length > 0) {
          return serialize(docs);
        }
      }
    } catch (err) {
      console.error("getServices DB error:", err);
    }
    let res = getMockPopulatedServices();
    if (opts?.featured) res = res.filter((s) => s.featured);
    return serialize(res);
  }, 120_000);
});

export const getFeatures = reactCache(async function getFeatures(): Promise<IFeature[]> {
  return withCache("features_all", async () => {
    try {
      const db = await connectDB();
      if (db) {
        const docs = await Feature.find({ active: true })
          .sort({ order: 1, _id: 1 })
          .lean<IFeature[]>();
        if (docs && docs.length > 0) {
          return serialize(docs);
        }
      }
    } catch (err) {
      console.error("getFeatures DB error:", err);
    }
    return serialize(mockSpecialFeatures.filter((f) => f.active));
  }, 120_000);
});

export async function getServiceBySlug(
  slug: string
): Promise<PopulatedService | null> {
  if (!slug) return null;
  const raw = String(slug).trim();
  const decoded = decodeURIComponent(raw).trim();
  const slugDash = decoded.toLowerCase().replace(/\s+/g, "-");
  const slugSpace = decoded.toLowerCase().replace(/-/g, " ");

  const cacheKey = `service_by_slug_${slug}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const orConditions: Record<string, unknown>[] = [
          { slug: raw },
          { slug: decoded },
          { slug: slugDash },
          { slug: slugSpace },
          { slug: { $regex: new RegExp(`^${decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { slug: { $regex: new RegExp(`^${slugDash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { slug: { $regex: new RegExp(`^${slugSpace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { title: { $regex: new RegExp(`^${decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { title: { $regex: new RegExp(`^${slugSpace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        ];
        if (mongoose.Types.ObjectId.isValid(raw)) {
          orConditions.push({ _id: raw });
        }

        const doc = await Service.findOne({
          $or: orConditions,
          published: { $ne: false },
        })
          .populate("category")
          .populate({ path: "relatedProducts", populate: { path: "category" } })
          .lean<PopulatedService | null>();
        if (doc) return serialize(doc);
      }
    } catch (err) {
      console.error("getServiceBySlug DB error:", err);
    }

    const s = getMockPopulatedServices().find((item) => {
      const itemSlug = (item.slug || "").toLowerCase();
      const itemTitle = (item.title || "").toLowerCase();
      return (
        itemSlug === raw.toLowerCase() ||
        itemSlug === decoded.toLowerCase() ||
        itemSlug === slugDash ||
        itemSlug === slugSpace ||
        itemTitle === decoded.toLowerCase() ||
        itemTitle === slugSpace ||
        item._id === raw
      );
    });
    return s ? serialize(s) : null;
  }, 120_000);
}

export const getProducts = reactCache(async function getProducts(opts?: {
  featured?: boolean;
  categorySlug?: string;
  subCategorySlug?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<PopulatedProduct[]> {
  const cacheKey = `products_${JSON.stringify(opts || {})}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const filter: Record<string, unknown> = { published: true };
        if (opts?.featured) filter.featured = true;

        if (opts?.categorySlug) {
          const allCats = await getCategories("product");
          const catDoc = allCats.find(
            (c) =>
              c.slug === opts.categorySlug ||
              String(c._id) === opts.categorySlug ||
              c.name.toLowerCase() === opts.categorySlug?.replace(/-/g, " ").toLowerCase()
          );
          if (catDoc) {
            filter.category = mongoose.Types.ObjectId.isValid(String(catDoc._id))
              ? new mongoose.Types.ObjectId(String(catDoc._id))
              : catDoc._id;
          } else {
            return [];
          }
        }

        if (opts?.subCategorySlug) {
          const allSubs = await getSubCategories();
          const subDoc = allSubs.find(
            (s) =>
              s.slug === opts.subCategorySlug ||
              String(s._id) === opts.subCategorySlug ||
              s.name.toLowerCase() === opts.subCategorySlug?.replace(/-/g, " ").toLowerCase()
          );
          if (subDoc) {
            filter.subCategory = mongoose.Types.ObjectId.isValid(String(subDoc._id))
              ? new mongoose.Types.ObjectId(String(subDoc._id))
              : subDoc._id;
          } else {
            return [];
          }
        }

        if (opts?.q) {
          const qRegex = { $regex: opts.q, $options: "i" };
          filter.$or = [
            { name: qRegex },
            { shortDescription: qRegex },
            { description: qRegex },
            { sku: qRegex },
            { brand: qRegex },
          ];
        }

        let query = Product.find(filter)
          .select("name slug sku itemNameModel brand category subCategory shortDescription price currency image inStock featured published order createdAt deliveryTime options variants")
          .sort(opts?.featured ? { featured: -1, order: 1, createdAt: -1 } : { order: 1, featured: -1, createdAt: -1 });

        if (opts?.page && opts?.limit) {
          query = query.skip((opts.page - 1) * opts.limit).limit(opts.limit);
        } else if (opts?.limit) {
          query = query.limit(opts.limit);
        }

        const rawDocs = await query.lean<PopulatedProduct[]>();

        if (rawDocs && rawDocs.length > 0) {
          const allCats = await getCategories("product");
          const catMap = new Map<string, ICategory>();
          for (const c of allCats) {
            catMap.set(String(c._id), c);
            catMap.set(c.slug, c);
          }

          const populated = rawDocs.map((p) => {
            let cat = p.category;
            if (!cat || typeof cat !== "object" || !("name" in cat)) {
              const ref = String(cat);
              cat = catMap.get(ref) || ({
                _id: ref,
                name: ref.replace(/-/g, " "),
                slug: ref,
                order: 0,
              } as unknown as ICategory);
            }

            return {
              ...p,
              category: cat,
              subCategory: p.subCategory || null,
              relatedServices: p.relatedServices || [],
            };
          });

          return serialize(populated);
        }
        return [];
      }
    } catch (err) {
      console.error("getProducts DB error:", err);
    }

    // If DB connection was truly unavailable, fallback to mock data
    let list = getMockPopulatedProducts();
    if (opts?.featured) list = list.filter((p) => p.featured);
    if (opts?.categorySlug) {
      list = list.filter(
        (p) =>
          p.category?.slug === opts.categorySlug ||
          String(p.category?._id) === opts.categorySlug
      );
    }
    if (opts?.subCategorySlug) {
      list = list.filter(
        (p) =>
          p.subCategory?.slug === opts.subCategorySlug ||
          String(p.subCategory?._id) === opts.subCategorySlug
      );
    }
    if (opts?.q) {
      const lq = opts.q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lq) ||
          (p.sku ? p.sku.toLowerCase().includes(lq) : false) ||
          (p.brand ? p.brand.toLowerCase().includes(lq) : false)
      );
    }
    if (opts?.page && opts?.limit) {
      const start = (opts.page - 1) * opts.limit;
      list = list.slice(start, start + opts.limit);
    } else if (opts?.limit) {
      list = list.slice(0, opts.limit);
    }
    return serialize(list);
  }, 120_000);
});

export const getProductsTotalCount = reactCache(async function getProductsTotalCount(opts?: {
  featured?: boolean;
  categorySlug?: string;
  subCategorySlug?: string;
  q?: string;
}): Promise<number> {
  const cacheKey = `products_count_${JSON.stringify(opts || {})}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const filter: Record<string, unknown> = { published: true };
        if (opts?.featured) filter.featured = true;

        if (opts?.categorySlug) {
          const allCats = await getCategories("product");
          const catDoc = allCats.find(
            (c) =>
              c.slug === opts.categorySlug ||
              String(c._id) === opts.categorySlug ||
              c.name.toLowerCase() === opts.categorySlug?.replace(/-/g, " ").toLowerCase()
          );
          if (catDoc) {
            filter.category = mongoose.Types.ObjectId.isValid(String(catDoc._id))
              ? new mongoose.Types.ObjectId(String(catDoc._id))
              : catDoc._id;
          } else {
            return 0;
          }
        }

        if (opts?.subCategorySlug) {
          const allSubs = await getSubCategories();
          const subDoc = allSubs.find(
            (s) =>
              s.slug === opts.subCategorySlug ||
              String(s._id) === opts.subCategorySlug ||
              s.name.toLowerCase() === opts.subCategorySlug?.replace(/-/g, " ").toLowerCase()
          );
          if (subDoc) {
            filter.subCategory = mongoose.Types.ObjectId.isValid(String(subDoc._id))
              ? new mongoose.Types.ObjectId(String(subDoc._id))
              : subDoc._id;
          } else {
            return 0;
          }
        }

        if (opts?.q) {
          const qRegex = { $regex: opts.q, $options: "i" };
          filter.$or = [
            { name: qRegex },
            { shortDescription: qRegex },
            { description: qRegex },
            { sku: qRegex },
            { brand: qRegex },
          ];
        }

        return await Product.countDocuments(filter);
      }
    } catch (err) {
      console.error("getProductsTotalCount DB error:", err);
    }
    return 0;
  }, 120_000);
});

export const getProductBySlug = reactCache(async function getProductBySlug(
  slug: string
): Promise<PopulatedProduct | null> {
  const cacheKey = `product_slug_${slug}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const decodedSlug = decodeURIComponent(slug).trim();
        const slugLower = decodedSlug.toLowerCase();

        // 1. Exact match on unique slug index (fastest IXSCAN)
        let doc = await Product.findOne({
          slug: slugLower,
          published: true,
        })
          .populate("relatedServices")
          .lean<PopulatedProduct | null>();

        if (!doc && decodedSlug !== slugLower) {
          doc = await Product.findOne({
            slug: decodedSlug,
            published: true,
          })
            .populate("relatedServices")
            .lean<PopulatedProduct | null>();
        }

        // 2. Exact match on SKU index
        if (!doc) {
          doc = await Product.findOne({
            sku: decodedSlug,
            published: true,
          })
            .populate("relatedServices")
            .lean<PopulatedProduct | null>();
        }

        // 3. Match on ObjectId if valid
        if (!doc && mongoose.Types.ObjectId.isValid(decodedSlug)) {
          doc = await Product.findOne({ _id: decodedSlug, published: true })
            .populate("relatedServices")
            .lean<PopulatedProduct | null>();
        }

        // 4. Case-insensitive regex fallback only when exact matches not found
        if (!doc) {
          const slugRegex = new RegExp(`^${decodedSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
          doc = await Product.findOne({
            $or: [{ slug: slugRegex }, { sku: slugRegex }],
            published: true,
          })
            .populate("relatedServices")
            .lean<PopulatedProduct | null>();
        }

        if (doc) {
          const allCats = await getCategories("product");
          const allSubs = await getSubCategories();
          const catMap = new Map<string, ICategory>();
          for (const c of allCats) {
            catMap.set(String(c._id), c);
            catMap.set(c.slug, c);
          }
          const subMap = new Map<string, ISubCategory>();
          for (const s of allSubs) {
            subMap.set(String(s._id), s);
            subMap.set(s.slug, s);
          }

          if (!doc.category || typeof doc.category !== "object" || !("name" in doc.category)) {
            const catId = String(doc.category);
            const foundCat = catMap.get(catId) || ({
              _id: catId,
              name: catId.replace(/-/g, " "),
              slug: catId,
              order: 0,
            } as unknown as ICategory);
            doc.category = foundCat;
          }

          if (doc.subCategory && (typeof doc.subCategory !== "object" || !("name" in doc.subCategory))) {
            const subId = String(doc.subCategory);
            const foundSub = subMap.get(subId) || null;
            doc.subCategory = foundSub;
          }

          return serialize(doc);
        }
      }
    } catch (err) {
      console.error("getProductBySlug DB error:", err);
    }

    const p = getMockPopulatedProducts().find(
      (item) => item.slug === slug || String(item._id) === slug || item.sku === slug
    );
    return p ? serialize(p) : null;
  }, 120_000);
});

export async function getRelatedProducts(
  categoryId: string,
  excludeSlug: string,
  limit = 15
): Promise<PopulatedProduct[]> {
  const cacheKey = `related_prods_${categoryId}_${excludeSlug}_${limit}`;
  return withCache(cacheKey, async () => {
    try {
      const db = await connectDB();
      if (db) {
        const catTarget = mongoose.Types.ObjectId.isValid(categoryId)
          ? new mongoose.Types.ObjectId(categoryId)
          : categoryId;

        const [primaryDocs, allCats, allSubs] = await Promise.all([
          Product.find({
            category: catTarget,
            slug: { $ne: excludeSlug },
            published: true,
          })
            .select("name slug sku itemNameModel brand category subCategory shortDescription price currency image inStock featured published order createdAt deliveryTime options variants")
            .sort({ order: 1, featured: -1, createdAt: -1 })
            .limit(limit)
            .lean<PopulatedProduct[]>(),
          getCategories("product"),
          getSubCategories(),
        ]);

        const catMap = new Map<string, ICategory>();
        for (const c of allCats) {
          catMap.set(String(c._id), c);
          catMap.set(c.slug, c);
        }
        const subMap = new Map<string, ISubCategory>();
        for (const s of allSubs) {
          subMap.set(String(s._id), s);
          subMap.set(s.slug, s);
        }

        const mapProduct = (p: PopulatedProduct) => {
          let cat = p.category;
          if (!cat || typeof cat !== "object" || !("name" in cat)) {
            const ref = String(cat);
            cat = catMap.get(ref) || ({
              _id: ref,
              name: ref.replace(/-/g, " "),
              slug: ref,
              order: 0,
            } as unknown as ICategory);
          }
          let sub = p.subCategory;
          if (sub && (typeof sub !== "object" || !("name" in sub))) {
            const subRef = String(sub);
            sub = subMap.get(subRef) || null;
          }
          return {
            ...p,
            category: cat,
            subCategory: sub,
            relatedServices: p.relatedServices || [],
          };
        };

        if (primaryDocs && primaryDocs.length >= limit) {
          return serialize(dedupeRelatedProducts(primaryDocs.map(mapProduct), excludeSlug));
        }

        const existingIds = (primaryDocs || []).map((d) => d._id);
        const extraNeeded = limit - (primaryDocs ? primaryDocs.length : 0);

        const fallbackDocs = await Product.find({
          _id: { $nin: existingIds.length ? existingIds : [null] },
          slug: { $ne: excludeSlug },
          published: true,
        })
          .select("name slug sku itemNameModel brand category subCategory shortDescription price currency image inStock featured published order createdAt deliveryTime options variants")
          .sort({ featured: -1, order: 1, createdAt: -1 })
          .limit(extraNeeded)
          .lean<PopulatedProduct[]>();

        const combined = [...(primaryDocs || []), ...(fallbackDocs || [])].map(mapProduct);
        return serialize(dedupeRelatedProducts(combined, excludeSlug));
      }
    } catch (err) {
      console.error("getRelatedProducts DB error:", err);
    }

    const allMock = getMockPopulatedProducts().filter((p) => p.slug !== excludeSlug);
    const sameCat = allMock.filter(
      (p) =>
        String(p.category._id) === String(categoryId) ||
        p.category.slug === categoryId
    );
    const otherCat = allMock.filter(
      (p) =>
        String(p.category._id) !== String(categoryId) &&
        p.category.slug !== categoryId
    );

    sameCat.sort((a, b) => (a.order || 999) - (b.order || 999));
    otherCat.sort((a, b) => (a.order || 999) - (b.order || 999));

    return serialize(dedupeRelatedProducts([...sameCat, ...otherCat], excludeSlug).slice(0, limit));
  }, 120_000);
}

function dedupeRelatedProducts(items: PopulatedProduct[], excludeSlug: string) {
  const seen = new Set<string>();
  return items.filter((p) => {
    if (!p || p.slug === excludeSlug) return false;
    const id = String(p._id);
    if (seen.has(id) || seen.has(p.slug)) return false;
    seen.add(id);
    seen.add(p.slug);
    return true;
  });
}

function toUseCaseDoc(item: (typeof useCaseContent)[number]): IUseCase {
  return {
    _id: item.slug,
    ...item,
    published: true,
  };
}

export const getUseCases = reactCache(async function getUseCases(): Promise<IUseCase[]> {
  return withCache("use_cases_all", async () => {
    try {
      await connectDB();
      const docs = await UseCase.find({ published: true })
        .sort({ order: 1 })
        .lean<IUseCase[]>();
      if (docs.length) return serialize(docs);
    } catch {
      // fall through to editorial content
    }
    return useCaseContent.map(toUseCaseDoc);
  }, 120_000);
});

export async function getUseCaseBySlug(slug: string): Promise<IUseCase | null> {
  const cacheKey = `use_case_slug_${slug}`;
  return withCache(cacheKey, async () => {
    try {
      await connectDB();
      const doc = await UseCase.findOne({ slug, published: true }).lean<IUseCase | null>();
      if (doc) return serialize(doc);
    } catch {
      // fall through
    }
    const local = useCaseContent.find((item) => item.slug === slug);
    return local ? toUseCaseDoc(local) : null;
  }, 120_000);
}

export type PopulatedBlogPost = Omit<IBlogPost, "category" | "_id"> & {
  _id: string;
  category?: { _id: string; name: string; slug: string } | null;
  readTime?: string;
};

export const getBlogCategories = reactCache(async function getBlogCategories(): Promise<IMockBlogCategory[]> {
  return withCache("blog_cats_all", async () => {
    try {
      await connectDB();
      const docs = await BlogCategory.find({ active: true })
        .sort({ order: 1, name: 1 })
        .lean();
      if (docs.length) return serialize(docs) as unknown as IMockBlogCategory[];
    } catch {
      // fall through
    }
    return mockBlogCategories;
  }, 120_000);
});

export const getBlogPosts = reactCache(async function getBlogPosts(options?: {
  categorySlug?: string;
  limit?: number;
}): Promise<PopulatedBlogPost[]> {
  const cacheKey = `blog_posts_${JSON.stringify(options || {})}`;
  return withCache(cacheKey, async () => {
    try {
      await connectDB();
      const filter: Record<string, unknown> = { status: "published" };
      if (options?.categorySlug) {
        const cat = await BlogCategory.findOne({ slug: options.categorySlug }).lean<{ _id: unknown } | null>();
        if (cat) filter.category = cat._id;
      }

      const query = BlogPost.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 });

      if (options?.limit) {
        query.limit(options.limit);
      }

      const docs = await query.lean();
      if (docs.length) return serialize(docs) as unknown as PopulatedBlogPost[];
    } catch {
      // fall through
    }

    let posts = mockBlogPosts.filter((p) => p.status === "published");
    if (options?.categorySlug) {
      posts = posts.filter((p) => p.category.slug === options.categorySlug);
    }
    if (options?.limit) {
      posts = posts.slice(0, options.limit);
    }
    return posts as unknown as PopulatedBlogPost[];
  }, 120_000);
});

export async function getBlogPostBySlug(
  slug: string
): Promise<PopulatedBlogPost | null> {
  const cacheKey = `blog_post_slug_${slug}`;
  return withCache(cacheKey, async () => {
    try {
      await connectDB();
      const doc = await BlogPost.findOne({ slug, status: "published" })
        .populate("category", "name slug")
        .lean();
      if (doc) return serialize(doc) as unknown as PopulatedBlogPost;
    } catch {
      // fall through
    }

    const post = mockBlogPosts.find((p) => p.slug === slug);
    return (post as unknown as PopulatedBlogPost) || null;
  }, 120_000);
}

export async function getRelatedBlogPosts(
  currentSlug: string,
  categorySlug?: string,
  limit = 3
): Promise<PopulatedBlogPost[]> {
  const allPosts = await getBlogPosts();
  const others = allPosts.filter((p) => p.slug !== currentSlug);
  if (!categorySlug) return others.slice(0, limit);

  const sameCat = others.filter(
    (p) => typeof p.category === "object" && p.category?.slug === categorySlug
  );
  const differentCat = others.filter(
    (p) => typeof p.category !== "object" || p.category?.slug !== categorySlug
  );
  return [...sameCat, ...differentCat].slice(0, limit);
}
