import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eventEmitter, EVENTS } from "@/lib/events";
import { emitSocketEvent } from "@/lib/socket-emitter";

type Ctx = { params: Promise<{ slug: string; tableId: string }> };

const placeOrderSchema = z.object({
  sessionToken: z.string().min(1, "Session token required"),
  specialNotes: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1, "At least one item is required"),
});

/**
 * POST /api/customer/[slug]/[tableId]/orders
 *
 * Places an order within the active dining session.
 * - Validates the session token (anti-spoofing).
 * - Fetches live prices from DB (cart prices are advisory only).
 * - Generates a daily-sequential order number.
 * - Creates Order + OrderItems in a transaction.
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, tableId } = await params;

    const body = await request.json();
    const parsed = placeOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sessionToken, specialNotes, items } = parsed.data;

    // 1. Verify restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Verify session token belongs to this table and is ACTIVE or BILL_REQUESTED
    const session = await prisma.diningSession.findFirst({
      where: {
        customerToken: sessionToken,
        tableId,
        restaurantId: restaurant.id,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
      select: {
        id: true,
        status: true,
        bill: {
          select: { id: true },
        },
      },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired. Please scan the QR code again." },
        { status: 403 }
      );
    }

    // 3. Fetch live menu item prices (never trust client-sent prices)
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurant.id,
        isDeleted: false,
        isAvailable: true,
      },
      select: { id: true, name: true, price: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      const foundIds = new Set(menuItems.map((m) => m.id));
      const missing = menuItemIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: "Some items are unavailable or no longer exist", unavailableIds: missing },
        { status: 409 }
      );
    }

    // Build a lookup map
    const priceMap = new Map(menuItems.map((m) => [m.id, m]));

    // 4. Compute total amount
    const orderItemsData = items.map((item) => {
      const menuItem = priceMap.get(item.menuItemId)!;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      };
    });

    const totalAmount = orderItemsData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 5. Setup daily order time window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 6. Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Acquire row-level write lock on the restaurant row to serialize daily order count updates
      await tx.$executeRaw`SELECT id FROM restaurants WHERE id = ${restaurant.id} FOR UPDATE`;

      const orderCountToday = await tx.order.count({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: today, lt: tomorrow },
        },
      });
      const orderNumber = orderCountToday + 1;

      // Revert session and table statuses back to active/occupied if they were bill requested
      if (session.status === "BILL_REQUESTED") {
        await tx.diningSession.update({
          where: { id: session.id },
          data: { status: "ACTIVE" },
        });

        await tx.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });

        if (session.bill) {
          await tx.bill.delete({
            where: { id: session.bill.id },
          });
        }

        await tx.billRequest.deleteMany({
          where: { sessionId: session.id },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          restaurantId: restaurant.id,
          sessionId: session.id,
          orderNumber,
          totalAmount,
          specialNotes: specialNotes?.trim() || null,
          status: "PENDING",
          items: {
            create: orderItemsData,
          },
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            select: { name: true, quantity: true, price: true },
          },
        },
      });
      return newOrder;
    });

    // Fetch full order details including table info for realtime events
    const orderWithTable = await prisma.order.findUnique({
      where: { id: order.id },
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

    if (orderWithTable) {
      eventEmitter.emit(EVENTS.ORDER_CREATED, {
        restaurantId: restaurant.id,
        order: orderWithTable,
      });
      // Broadcast to staff room via Socket.IO
      await emitSocketEvent(`restaurant:${restaurant.id}`, "order_created", orderWithTable);
    }

    return NextResponse.json(
      {
        message: "Order placed successfully!",
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          items: order.items,
          placedAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/customer/orders error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

/**
 * GET /api/customer/[slug]/[tableId]/orders
 * Returns all orders for the active session (for the order history view).
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, tableId } = await params;
    const sessionToken = request.nextUrl.searchParams.get("token");
    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const session = await prisma.diningSession.findFirst({
      where: { customerToken: sessionToken, tableId, restaurantId: restaurant.id },
      select: {
        id: true,
        status: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            specialNotes: true,
            createdAt: true,
            items: {
              select: { name: true, quantity: true, price: true },
            },
          },
        },
      },
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json({ orders: session.orders, sessionStatus: session.status });
  } catch (error) {
    console.error("GET /api/customer/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
