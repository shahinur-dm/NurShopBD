import { Schema, models, model, type Types } from "mongoose";

export interface IContactPageSettings {
  heading?: string;
  description?: string;
  phoneLabel?: string;
  emailLabel?: string;
  addressLabel?: string;
  hoursLabel?: string;
  formHeading?: string;
  nameLabel?: string;
  emailFieldLabel?: string;
  phoneFieldLabel?: string;
  companyLabel?: string;
  inquiryTypeLabel?: string;
  inquiryOptions?: string[];
  subjectLabel?: string;
  messageLabel?: string;
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface ISiteSettings {
  _id: Types.ObjectId | string;
  brandName: string;
  companyName?: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  wechatId?: string;
  address: string;
  addressHouse?: string;
  addressRoad?: string;
  addressBlock?: string;
  addressCity?: string;
  hours: string;
  workingDays?: string;
  mapShareUrl?: string;
  mapEmbedUrl: string;
  mapZoom?: number;
  contactPage?: IContactPageSettings;
  logoUrl?: string;
  footerLogoUrl?: string;
  favicon?: string;
  notice?: string;
  noticeBn?: string;
  noticeBoardSpeed?: number;
  noticeSpeed?: number;
  social: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
  };
  footerQr?: {
    wechatQr?: string;
    wechatQrLabel?: string;
    wechatQrEnabled?: boolean;
    whatsappQr?: string;
    whatsappQrLabel?: string;
    whatsappQrEnabled?: boolean;
  };
  heroBanners?: {
    banner1?: string;
    banner2?: string;
    banner3?: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    keywords: string[];
  };
  analytics: {
    gaMeasurementId?: string;
    googleSiteVerification?: string;
  };
  nav: { href: string; label: string; order: number }[];
  footerQuickLinks?: { label: string; href: string }[];
  footerServices?: { label: string; href: string }[];
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    brandName: { type: String, default: "NUR SHOP BD" },
    companyName: { type: String, default: "NUR SHOP BD" },
    tagline: { type: String, default: "Machine, spare parts and Technical service provider" },
    description: {
      type: String,
      default:
        "EEE-led supplier of PLC, motors, drives, sensors, and industrial spare parts with technical service across Bangladesh.",
    },
    email: { type: String, default: "ceo@nurengineering.bd.com" },
    phone: { type: String, default: "+8801805030940" },
    phone2: { type: String, default: "01805030941" },
    phone3: { type: String, default: "" },
    wechatId: { type: String, default: "nurul01713798987" },
    address: {
      type: String,
      default: "House#43-44, Road-1, Block -B, Mirpur-1 (Beside Shah Ali Thana), Dhaka-1216",
    },
    addressHouse: { type: String, default: "43-44" },
    addressRoad: { type: String, default: "1" },
    addressBlock: { type: String, default: "B" },
    addressCity: { type: String, default: "Mirpur-1, Dhaka-1216, Bangladesh" },
    hours: { type: String, default: "Sat–Thu 9:00–18:00" },
    workingDays: { type: String, default: "Saturday – Thursday" },
    mapShareUrl: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    mapZoom: { type: Number, default: 15 },
    contactPage: {
      heading: { type: String, default: "Send a part number or photo" },
      description: {
        type: String,
        default: "We reply with options, stock and pricing. Same desk for products and technical service.",
      },
      phoneLabel: { type: String, default: "Phone" },
      emailLabel: { type: String, default: "Email" },
      addressLabel: { type: String, default: "Address" },
      hoursLabel: { type: String, default: "Hours" },
      formHeading: { type: String, default: "" },
      nameLabel: { type: String, default: "Name" },
      emailFieldLabel: { type: String, default: "Email" },
      phoneFieldLabel: { type: String, default: "Phone" },
      companyLabel: { type: String, default: "Company / Workshop" },
      inquiryTypeLabel: { type: String, default: "Inquiry type" },
      inquiryOptions: {
        type: [String],
        default: ["Product quote", "Parts sourcing", "Technical service", "Other"],
      },
      subjectLabel: { type: String, default: "Subject" },
      messageLabel: { type: String, default: "Message" },
      submitButtonText: { type: String, default: "Send Inquiry" },
      successMessage: { type: String, default: "Message received. We will reply shortly." },
      errorMessage: { type: String, default: "Failed to send message. Please try again." },
    },
    logoUrl: { type: String, default: "" },
    footerLogoUrl: { type: String, default: "" },
    favicon: { type: String, default: "" },
    notice: {
      type: String,
      default: "Out of stock products will be delivered within 3–5 days.",
    },
    noticeBn: {
      type: String,
      default:
        "★ কোন পার্টস স্টকে না থাকলে জরুরী প্রয়োজনে অর্ডার দেওয়ার ০৩ কার্যদিবসের মধ্যে চায়না থেকে আমদানি করে সরবরাহ করা হয় ★",
    },
    noticeBoardSpeed: {
      type: Number,
      default: 50,
    },
    noticeSpeed: {
      type: Number,
      default: 84,
    },
    social: {
      facebook: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    footerQr: {
      wechatQr: { type: String, default: "" },
      wechatQrLabel: { type: String, default: "WECHAT QR SCAN" },
      wechatQrEnabled: { type: Boolean, default: true },
      whatsappQr: { type: String, default: "" },
      whatsappQrLabel: { type: String, default: "WHATSAPP QR SCAN" },
      whatsappQrEnabled: { type: Boolean, default: true },
    },
    heroBanners: {
      banner1: { type: String, default: "" },
      banner2: { type: String, default: "" },
      banner3: { type: String, default: "" },
    },
    seo: {
      defaultTitle: {
        type: String,
        default: "NUR SHOP BD | Machine Parts & Technical Service",
      },
      defaultDescription: {
        type: String,
        default:
          "Buy PLC, motors, VFD, sensors, contactors and industrial spare parts. Technical service from an EEE engineering desk in Bangladesh.",
      },
      keywords: [{ type: String }],
    },
    analytics: {
      gaMeasurementId: { type: String, default: "" },
      googleSiteVerification: { type: String, default: "" },
    },
    nav: [
      {
        href: { type: String, default: "" },
        label: { type: String, default: "" },
        order: { type: Number, default: 0 },
        _id: false,
      },
    ],
    footerQuickLinks: [
      {
        label: { type: String, default: "" },
        href: { type: String, default: "" },
        _id: false,
      },
    ],
    footerServices: [
      {
        label: { type: String, default: "" },
        href: { type: String, default: "" },
        _id: false,
      },
    ],
  },
  { timestamps: true, strict: false }
);

export const SiteSettings =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
