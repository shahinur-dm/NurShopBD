import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10));

  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { orderId: { $regex: q, $options: "i" } },
        { "customer.name": { $regex: q, $options: "i" } },
        { "customer.phone": { $regex: q, $options: "i" } },
        { "customer.email": { $regex: q, $options: "i" } },
        { "product.name": { $regex: q, $options: "i" } },
        { "product.sku": { $regex: q, $options: "i" } },
        { "items.name": { $regex: q, $options: "i" } },
        { "items.sku": { $regex: q, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    const [rawItems, total, pendingCount, orderCount, inquiryCount] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
      Order.countDocuments({ status: "Pending" }),
      Order.countDocuments({ type: "ORDER" }),
      Order.countDocuments({ type: "PRICE REQUEST" }),
    ]);

    // Normalize legacy orders for safe display
    const items = rawItems.map((order: Record<string, unknown>) => {
      let orderItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      if (orderItems.length === 0 && order.product) {
        const prod = order.product as Record<string, unknown>;
        const singleQty = Number(order.quantity) || 1;
        const singleUnit = Number(order.unitPrice) || 0;
        const singleTotal = Number(order.totalPrice) || singleUnit * singleQty;
        orderItems = [
          {
            productId: prod._id || prod.id,
            name: prod.name || "Product",
            slug: prod.slug || "",
            sku: prod.sku || "",
            image: prod.image || "",
            categoryName: prod.categoryName || "",
            quantity: singleQty,
            unitPrice: singleUnit > 0 ? singleUnit : undefined,
            totalPrice: singleTotal > 0 ? singleTotal : undefined,
            deliveryTime: "2–3 Working Days",
          },
        ];
      }

      const calculatedSubtotal =
        order.subtotal !== undefined && order.subtotal !== null
          ? Number(order.subtotal)
          : orderItems.reduce(
              (sum: number, it: { totalPrice?: number; unitPrice?: number; quantity?: number }) =>
                sum + (it.totalPrice || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0)),
              0
            );

      const deliveryCharge = Number(order.deliveryCharge) || 0;
      const calculatedGrandTotal =
        order.grandTotal !== undefined && order.grandTotal !== null
          ? Number(order.grandTotal)
          : calculatedSubtotal + deliveryCharge;

      return {
        ...order,
        items: orderItems,
        subtotal: calculatedSubtotal,
        deliveryCharge,
        grandTotal: calculatedGrandTotal > 0 ? calculatedGrandTotal : calculatedSubtotal,
      };
    });

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      summary: {
        total,
        pendingCount,
        orderCount,
        inquiryCount,
      },
    });
  } catch (err: unknown) {
    console.error("Fetch orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load orders" },
      { status: 500 }
    );
  }
}

