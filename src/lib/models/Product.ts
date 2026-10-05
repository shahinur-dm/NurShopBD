import { Schema, models, model, type Types } from "mongoose";

export interface IProductOption {
  name: string;
  values: string[];
}

export interface IProductVariant {
  name: string;
  sku?: string;
  price?: number;
  options?: Record<string, string>;
}

export interface IProduct {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  sku?: string;
  itemNameModel?: string;
  benefitPoint1?: string;
  benefitPoint2?: string;
  benefitPoint3?: string;
  benefitPoint4?: string;
  brand?: string;
  category: Types.ObjectId | string;
  subCategory?: Types.ObjectId | string;
  shortDescription: string;
  description: string;
  price?: number;
  currency: string;
  image: string;
  gallery?: string[];
  videoUrl?: string;
  specs: string[];
  specTable?: { label: string; value: string }[];
  atAGlance?: { label: string; value: string }[];
  includedItems?: string[];
  beforeYouOrder?: string[];
  condition?: string;
  packing?: string;
  warranty?: string;
  warrantyAndReturns?: string;
  availabilityText?: string;
  deliveryTime?: string;
  options?: IProductOption[];
  variants?: IProductVariant[];
  relatedProducts?: (Types.ObjectId | string)[];
  relatedServices?: (Types.ObjectId | string)[];
  inStock: boolean;
  featured: boolean;
  published: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: String,
    itemNameModel: String,
    benefitPoint1: { type: String, default: "100% genuine, authorised stock" },
    benefitPoint2: { type: String, default: "12-month manufacturer warranty" },
    benefitPoint3: { type: String, default: "Nationwide delivery in 2-4 days" },
    benefitPoint4: { type: String, default: "Cash on delivery available" },
    brand: String,
    category: {
      type: Schema.Types.Mixed,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategory: {
      type: Schema.Types.Mixed,
      ref: "SubCategory",
      index: true,
    },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    price: Number,
    currency: { type: String, default: "BDT" },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    videoUrl: String,
    specs: [{ type: String }],
    specTable: [{ label: String, value: String }],
    atAGlance: [{ label: String, value: String }],
    includedItems: [{ type: String }],
    beforeYouOrder: [{ type: String }],
    condition: String,
    packing: String,
    warranty: String,
    warrantyAndReturns: String,
    availabilityText: String,
    deliveryTime: { type: String, default: "2–3 Working Days" },
    options: [{ name: String, values: [String] }],
    variants: [{ name: String, sku: String, price: Number, options: Schema.Types.Mixed }],
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    relatedServices: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, autoIndex: false }
);

ProductSchema.index({ name: "text", shortDescription: "text", sku: "text" });
ProductSchema.index({ published: 1, order: 1, featured: -1, createdAt: -1 });
ProductSchema.index({ published: 1, featured: -1, order: 1, createdAt: -1 });
ProductSchema.index({ order: 1, createdAt: -1 });
ProductSchema.index({ category: 1, published: 1, order: 1, featured: -1, createdAt: -1 });
ProductSchema.index({ subCategory: 1, published: 1, order: 1, featured: -1, createdAt: -1 });
ProductSchema.index({ featured: 1, published: 1 });

export const Product =
  models.Product || model<IProduct>("Product", ProductSchema);



