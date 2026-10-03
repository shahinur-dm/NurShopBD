import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const db = await connectDB();
    if (!db) return NextResponse.json({ error: "Database connection failed" }, { status: 500 });

    const rawOrder = await Order.findById(id).lean<Record<string, unknown> | null>();
    if (!rawOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let orderItems = Array.isArray(rawOrder.items) && rawOrder.items.length > 0 ? rawOrder.items : [];
    if (orderItems.length === 0 && rawOrder.product) {
      const prod = rawOrder.product as Record<string, unknown>;
      const singleQty = Number(rawOrder.quantity) || 1;
      const singleUnit = Number(rawOrder.unitPrice) || 0;
      const singleTotal = Number(rawOrder.totalPrice) || singleUnit * singleQty;
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
      rawOrder.subtotal !== undefined && rawOrder.subtotal !== null
        ? Number(rawOrder.subtotal)
        : orderItems.reduce(
            (sum: number, it: { totalPrice?: number; unitPrice?: number; quantity?: number }) =>
              sum + (it.totalPrice || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0)),
            0
          );

    const deliveryCharge = Number(rawOrder.deliveryCharge) || 0;
    const calculatedGrandTotal =
      rawOrder.grandTotal !== undefined && rawOrder.grandTotal !== null
        ? Number(rawOrder.grandTotal)
        : calculatedSubtotal + deliveryCharge;

    const order = {
      ...rawOrder,
      items: orderItems,
      subtotal: calculatedSubtotal,
      deliveryCharge,
      grandTotal: calculatedGrandTotal > 0 ? calculatedGrandTotal : calculatedSubtotal,
    };

    return NextResponse.json({ order });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "viewer") {
    return NextResponse.json({ error: "Forbidden: Viewer cannot edit orders" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const db = await connectDB();
    if (!db) return NextResponse.json({ error: "Database connection failed" }, { status: 500 });

    const existingOrder = await Order.findById(id).lean<Record<string, unknown> | null>();
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
    if (body.subtotal !== undefined) updateData.subtotal = Number(body.subtotal);

    // If delivery charge is updated, recalculate grandTotal
    if (body.deliveryCharge !== undefined && body.deliveryCharge !== null && !isNaN(Number(body.deliveryCharge))) {
      const newDeliveryCharge = Number(body.deliveryCharge);
      updateData.deliveryCharge = newDeliveryCharge;

      const currentSubtotal =
        updateData.subtotal !== undefined
          ? Number(updateData.subtotal)
          : existingOrder.subtotal !== undefined && existingOrder.subtotal !== null
          ? Number(existingOrder.subtotal)
          : Array.isArray(existingOrder.items) && existingOrder.items.length > 0
          ? existingOrder.items.reduce(
              (sum: number, it: { totalPrice?: number; unitPrice?: number; quantity?: number }) =>
                sum + (it.totalPrice || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0)),
              0
            )
          : Number(existingOrder.totalPrice) || 0;

      updateData.grandTotal = currentSubtotal + newDeliveryCharge;
      updateData.totalPrice = updateData.grandTotal; // legacy compatibility
    } else if (body.grandTotal !== undefined) {
      updateData.grandTotal = Number(body.grandTotal);
      updateData.totalPrice = updateData.grandTotal;
    } else if (body.totalPrice !== undefined) {
      updateData.totalPrice = Number(body.totalPrice);
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let detailMsg = `Updated order ${updatedOrder.orderId}`;
    if (body.status !== undefined) detailMsg += ` status to "${updatedOrder.status}"`;
    if (body.deliveryCharge !== undefined) detailMsg += ` delivery charge to "৳${updatedOrder.deliveryCharge}" (Grand Total: ৳${updatedOrder.grandTotal})`;

    await logActivity({
      action: "ORDER_UPDATE",
      entity: "Order",
      entityId: String(updatedOrder._id),
      details: detailMsg,
      user: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin" && admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const db = await connectDB();
    if (!db) return NextResponse.json({ error: "Database connection failed" }, { status: 500 });

    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await logActivity({
      action: "ORDER_DELETE",
      entity: "Order",
      entityId: String(id),
      details: `Deleted order ${deleted.orderId}`,
      user: {
        _id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete order" },
      { status: 500 }
    );
  }
}
