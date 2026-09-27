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

export interface IOrder {
  _id: Types.ObjectId | string;
  orderId: string;
  type: OrderType;
  product: {
    _id?: Types.ObjectId | string;
    id?: string;
    name: string;
    slug: string;
    sku?: string;
    image?: string;
    categoryName?: string;
  };
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  currency?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  note?: string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["ORDER", "PRICE REQUEST"],
      default: "ORDER",
      index: true,
    },
    product: {
      _id: { type: Schema.Types.ObjectId, ref: "Product" },
      id: { type: String },
      name: { type: String, required: true },
      slug: { type: String, required: true },
      sku: { type: String },
      image: { type: String },
      categoryName: { type: String },
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
    currency: { type: String, default: "BDT" },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
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
  },
  { timestamps: true }
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
