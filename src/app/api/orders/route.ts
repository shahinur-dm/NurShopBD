import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order, Product, type IOrderItem } from "@/lib/models";
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
      customer,
      note,
      deliveryLocation = "Dhaka",
      deliveryCharge: reqDeliveryCharge,
      items: rawItems,
      // Legacy single product fields
      productId,
      productName,
      productSlug,
      productSku,
      productImage,
      productCategory,
      quantity = 1,
      unitPrice,
      totalPrice,
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

    const orderType = type === "PRICE REQUEST" ? "PRICE REQUEST" : "ORDER";

    if (orderType === "ORDER" && (!customer.address || !customer.address.trim())) {
      return NextResponse.json(
        { success: false, error: "Delivery address is required" },
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

    // Build items array from either multi-item payload or legacy single product
    let parsedItems: IOrderItem[] = [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      parsedItems = rawItems.map((item: Record<string, unknown>) => {
        const itemQty = Math.max(1, Number(item.quantity) || 1);
        const itemUnitPrice =
          item.unitPrice !== undefined && item.unitPrice !== null && !isNaN(Number(item.unitPrice))
            ? Number(item.unitPrice)
            : undefined;
        const itemTotalPrice =
          item.totalPrice !== undefined && item.totalPrice !== null && !isNaN(Number(item.totalPrice))
            ? Number(item.totalPrice)
            : itemUnitPrice !== undefined
            ? itemUnitPrice * itemQty
            : undefined;

        let pId: mongoose.Types.ObjectId | string | undefined = undefined;
        if (item.productId && mongoose.Types.ObjectId.isValid(String(item.productId))) {
          pId = new mongoose.Types.ObjectId(String(item.productId));
        } else if (item.productId) {
          pId = String(item.productId);
        }

        return {
          productId: pId,
          name: String(item.name || "").trim(),
          slug: String(item.slug || "").trim(),
          sku: item.sku ? String(item.sku).trim() : undefined,
          image: item.image ? String(item.image) : undefined,
          categoryName: item.categoryName ? String(item.categoryName) : undefined,
          variant: item.variant ? String(item.variant) : undefined,
          selectedOptions:
            typeof item.selectedOptions === "object" && item.selectedOptions !== null
              ? (item.selectedOptions as Record<string, string>)
              : undefined,
          quantity: itemQty,
          unitPrice: itemUnitPrice,
          totalPrice: itemTotalPrice,
          deliveryTime: item.deliveryTime ? String(item.deliveryTime) : "2–3 Working Days",
        };
      });
    } else if (productName && productSlug) {
      // Legacy single product payload fallback
      const singleQty = Math.max(1, Number(quantity) || 1);
      const singleUnitPrice =
        unitPrice !== undefined && unitPrice !== null && !isNaN(Number(unitPrice))
          ? Number(unitPrice)
          : undefined;
      const singleTotalPrice =
        totalPrice !== undefined && totalPrice !== null && !isNaN(Number(totalPrice))
          ? Number(totalPrice)
          : singleUnitPrice !== undefined
          ? singleUnitPrice * singleQty
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

      parsedItems = [
        {
          productId: productRef,
          name: String(productName).trim(),
          slug: String(productSlug).trim(),
          sku: productSku ? String(productSku).trim() : undefined,
          image: productImage || undefined,
          categoryName: productCategory || undefined,
          quantity: singleQty,
          unitPrice: singleUnitPrice,
          totalPrice: singleTotalPrice,
          deliveryTime: "2–3 Working Days",
        },
      ];
    }

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order must contain at least one valid product item" },
        { status: 400 }
      );
    }

    // Calculate subtotal from snapshotted item prices
    const subtotal = parsedItems.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0
    );

    // Calculate delivery charge: Default Dhaka = ৳90, Outside Dhaka = ৳120
    const finalDeliveryLocation =
      deliveryLocation === "Outside Dhaka" ? "Outside Dhaka" : "Dhaka";
    let finalDeliveryCharge =
      finalDeliveryLocation === "Outside Dhaka" ? 120 : 90;

    if (
      reqDeliveryCharge !== undefined &&
      reqDeliveryCharge !== null &&
      !isNaN(Number(reqDeliveryCharge))
    ) {
      finalDeliveryCharge = Number(reqDeliveryCharge);
    }

    const grandTotal = subtotal > 0 ? subtotal + finalDeliveryCharge : 0;
    const totalQty = parsedItems.reduce((sum, item) => sum + item.quantity, 0);

    // Unique Order ID generation
    let orderId = generateOrderId();
    let collisionCheck = await Order.findOne({ orderId }).lean();
    while (collisionCheck) {
      orderId = generateOrderId();
      collisionCheck = await Order.findOne({ orderId }).lean();
    }

    const firstItem = parsedItems[0];

    const createdOrder = await Order.create({
      orderId,
      type: orderType,
      items: parsedItems,
      subtotal,
      deliveryCharge: finalDeliveryCharge,
      deliveryLocation: finalDeliveryLocation,
      grandTotal: grandTotal > 0 ? grandTotal : subtotal,
      currency: "BDT",
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        email: customer.email ? String(customer.email).trim().toLowerCase() : undefined,
        address: customer.address ? String(customer.address).trim() : undefined,
        deliveryLocation: finalDeliveryLocation,
      },
      note: note ? String(note).trim() : undefined,
      status: "Pending",
      // Legacy fallback fields
      product: {
        _id: firstItem.productId,
        name: firstItem.name,
        slug: firstItem.slug,
        sku: firstItem.sku,
        image: firstItem.image,
        categoryName: firstItem.categoryName,
      },
      quantity: totalQty,
      unitPrice: firstItem.unitPrice,
      totalPrice: grandTotal > 0 ? grandTotal : subtotal,
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

