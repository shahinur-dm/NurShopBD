import { Schema, models, model, type Types } from "mongoose";

export type OrderType = "ORDER" | "PRICE REQUEST";
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Delivered"
  | "Cancelled"
  | "Price Provided"
  | "Contacted"
  | "Closed";

export interface IOrderItem {
  _id?: Types.ObjectId | string;
  productId?: Types.ObjectId | string;
  id?: string;
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  categoryName?: string;
  variant?: string;
  selectedOptions?: Record<string, string>;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  deliveryTime?: string;
}

export interface IOrder {
  _id: Types.ObjectId | string;
  orderId: string;
  type: OrderType;
  items: IOrderItem[];
  subtotal?: number;
  deliveryCharge?: number;
  deliveryLocation?: string;
  grandTotal?: number;
  currency?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    deliveryLocation?: string;
  };
  note?: string;
  status: OrderStatus;
  adminNotes?: string;
  // Legacy single-item fallback fields for backward compatibility
  product?: {
    _id?: Types.ObjectId | string;
    id?: string;
    name: string;
    slug: string;
    sku?: string;
    image?: string;
    categoryName?: string;
  };
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    id: { type: String },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String },
    image: { type: String },
    categoryName: { type: String },
    variant: { type: String },
    selectedOptions: { type: Schema.Types.Mixed },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
    deliveryTime: { type: String },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["ORDER", "PRICE REQUEST"],
      default: "ORDER",
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    subtotal: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    deliveryLocation: { type: String, default: "Dhaka" },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
      deliveryLocation: { type: String, trim: true },
    },
    note: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Delivered",
        "Cancelled",
        "Price Provided",
        "Contacted",
        "Closed",
      ],
      default: "Pending",
      index: true,
    },
    adminNotes: { type: String, trim: true },
    // Legacy single-item fields (preserved for existing orders)
    product: {
      _id: { type: Schema.Types.ObjectId, ref: "Product" },
      id: { type: String },
      name: { type: String },
      slug: { type: String },
      sku: { type: String },
      image: { type: String },
      categoryName: { type: String },
    },
    quantity: { type: Number },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
  },
  { timestamps: true }
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);

