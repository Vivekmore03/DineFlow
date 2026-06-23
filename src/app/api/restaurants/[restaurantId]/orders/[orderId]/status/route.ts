import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventEmitter, EVENTS } from "@/lib/events";
import { emitSocketEvent } from "@/lib/socket-emitter";

type Ctx = { params: Promise<{ restaurantId: string; orderId: string }> };

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, orderId } = await params;

    // Verify restaurant membership
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Verify order exists and belongs to the restaurant
    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        session: {
          include: {
            table: {
              select: { id: true, name: true, number: true },
            },
          },
        },
      },
    });

    eventEmitter.emit(EVENTS.ORDER_UPDATED, {
      restaurantId,
      order: updatedOrder,
    });

    // Broadcast status change to staff dashboard room
    await emitSocketEvent(`restaurant:${restaurantId}`, "order_updated", updatedOrder);

    // Broadcast status change to the specific customer table room
    await emitSocketEvent(`restaurant:${restaurantId}:table:${updatedOrder.session.table.id}`, "order_updated", updatedOrder);

    return NextResponse.json({
      message: "Order status updated successfully!",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("PUT /api/restaurants/[restaurantId]/orders/[orderId]/status error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
