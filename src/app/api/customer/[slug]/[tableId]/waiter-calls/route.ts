import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { eventEmitter, EVENTS } from "@/lib/events";

type Ctx = { params: Promise<{ slug: string; tableId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, tableId } = await params;

    // 1. Verify restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Verify table
    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId: restaurant.id, isActive: true },
      select: { id: true },
    });
    if (!table) {
      return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
    }

    // 2.5 Verify dining session token
    const body = await request.json().catch(() => ({}));
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "Dining session token required" }, { status: 403 });
    }

    const session = await prisma.diningSession.findFirst({
      where: {
        customerToken: sessionToken,
        restaurantId: restaurant.id,
        tableId,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid dining session" }, { status: 403 });
    }

    // 3. Prevent waiter call spamming (max once every 30 seconds per table)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentCall = await prisma.waiterCall.findFirst({
      where: {
        tableId,
        restaurantId: restaurant.id,
        status: "PENDING",
        createdAt: { gte: thirtySecondsAgo },
      },
    });

    if (recentCall) {
      return NextResponse.json(
        { error: "A waiter call request has already been sent. A staff member is on the way!" },
        { status: 429 }
      );
    }

    // 4. Create waiter call
    const waiterCall = await prisma.waiterCall.create({
      data: {
        restaurantId: restaurant.id,
        tableId,
        status: "PENDING",
      },
    });

    const waiterCallWithTable = await prisma.waiterCall.findUnique({
      where: { id: waiterCall.id },
      include: {
        table: {
          select: { name: true, number: true },
        },
      },
    });

    if (waiterCallWithTable) {
      eventEmitter.emit(EVENTS.WAITER_CALL, {
        restaurantId: restaurant.id,
        waiterCall: waiterCallWithTable,
      });
      await emitSocketEvent(`restaurant:${restaurant.id}`, "waiter_call", waiterCallWithTable);
    }

    return NextResponse.json({
      message: "Staff member called successfully!",
      waiterCall,
    });
  } catch (error) {
    console.error("POST /api/customer/waiter-calls error:", error);
    return NextResponse.json({ error: "Failed to call staff" }, { status: 500 });
  }
}
