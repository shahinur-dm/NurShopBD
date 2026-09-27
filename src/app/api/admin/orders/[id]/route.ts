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

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice;

    const updatedOrder = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await logActivity({
      action: "ORDER_UPDATE",
      entity: "Order",
      entityId: String(updatedOrder._id),
      details: `Updated order ${updatedOrder.orderId} status to "${updatedOrder.status}"`,
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
