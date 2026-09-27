import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order, Product } from "@/lib/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      type = "ORDER",
      productId,
      productName,
      productSlug,
      productSku,
      productImage,
      productCategory,
      quantity = 1,
      unitPrice,
      totalPrice,
      customer,
      note,
    } = body;

    if (!customer?.name || !customer?.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (!customer?.phone || !customer?.phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!productName || !productSlug) {
      return NextResponse.json(
        { success: false, error: "Product information is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 500 }
      );
    }

    const orderType = type === "PRICE REQUEST" ? "PRICE REQUEST" : "ORDER";
    const qty = Math.max(1, Number(quantity) || 1);
    const parsedUnitPrice =
      unitPrice !== undefined && unitPrice !== null && !isNaN(Number(unitPrice))
        ? Number(unitPrice)
        : undefined;
    const parsedTotalPrice =
      totalPrice !== undefined && totalPrice !== null && !isNaN(Number(totalPrice))
        ? Number(totalPrice)
        : parsedUnitPrice !== undefined
        ? parsedUnitPrice * qty
        : undefined;

    let productRef: mongoose.Types.ObjectId | undefined = undefined;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      productRef = new mongoose.Types.ObjectId(productId);
    } else if (productSlug) {
      const foundProduct = await Product.findOne({ slug: productSlug })
        .select("_id")
        .lean<{ _id: mongoose.Types.ObjectId } | null>();
      if (foundProduct?._id) {
        productRef = foundProduct._id;
      }
    }

    let orderId = generateOrderId();
    let collisionCheck = await Order.findOne({ orderId }).lean();
    while (collisionCheck) {
      orderId = generateOrderId();
      collisionCheck = await Order.findOne({ orderId }).lean();
    }

    const createdOrder = await Order.create({
      orderId,
      type: orderType,
      product: {
        _id: productRef,
        id: productId ? String(productId) : undefined,
        name: String(productName).trim(),
        slug: String(productSlug).trim(),
        sku: productSku ? String(productSku).trim() : undefined,
        image: productImage || undefined,
        categoryName: productCategory || undefined,
      },
      quantity: qty,
      unitPrice: parsedUnitPrice,
      totalPrice: parsedTotalPrice,
      currency: "BDT",
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        email: customer.email ? String(customer.email).trim().toLowerCase() : undefined,
        address: customer.address ? String(customer.address).trim() : undefined,
      },
      note: note ? String(note).trim() : undefined,
      status: "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        orderId: createdOrder.orderId,
        order: createdOrder,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Order submission error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to place order",
      },
      { status: 500 }
    );
  }
}
