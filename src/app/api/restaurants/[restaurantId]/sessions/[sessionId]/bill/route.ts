import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ restaurantId: string; sessionId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId, sessionId } = await params;

    // Verify restaurant membership
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch session, its table, and its orders (excluding cancelled ones)
    const session = await prisma.diningSession.findFirst({
      where: { id: sessionId, restaurantId },
      include: {
        table: true,
        orders: {
          where: { status: { not: "CANCELLED" } },
          include: {
            items: true,
          },
        },
        bill: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Dining session not found" }, { status: 404 });
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({ error: "Session is already completed" }, { status: 400 });
    }

    // If bill already exists, return it
    if (session.bill) {
      return NextResponse.json({
        message: "Bill already generated",
        bill: session.bill,
      });
    }

    // If no orders placed, block bill generation
    if (session.orders.length === 0) {
      return NextResponse.json(
        { error: "No orders have been placed in this session yet." },
        { status: 400 }
      );
    }

    // 2. Fetch restaurant details for taxRate
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { taxRate: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 3. Aggregate items across all orders (group by name and price)
    const itemAggregation: Record<string, { name: string; unitPrice: number; quantity: number }> = {};

    for (const order of session.orders) {
      for (const item of order.items) {
        // Group by name + unitPrice to handle any manual price overrides, though item names are generally unique
        const key = `${item.name}_${item.price}`;
        if (itemAggregation[key]) {
          itemAggregation[key].quantity += item.quantity;
        } else {
          itemAggregation[key] = {
            name: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
          };
        }
      }
    }

    // 4. Calculate totals
    const billItemsData = Object.values(itemAggregation).map((itm) => ({
      name: itm.name,
      quantity: itm.quantity,
      unitPrice: itm.unitPrice,
      totalPrice: itm.unitPrice * itm.quantity,
    }));

    const subtotal = billItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = restaurant.taxRate;
    const taxAmount = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
    const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

    // 5. Generate human-readable Bill Number (BILL-0001, etc.)
    const billCount = await prisma.bill.count({
      where: { restaurantId },
    });
    const billNumber = `BILL-${String(billCount + 1).padStart(4, "0")}`;

    // 6. Create Bill and items, and update status in transaction
    const finalBill = await prisma.$transaction(async (tx) => {
      const createdBill = await tx.bill.create({
        data: {
          restaurantId,
          sessionId,
          billNumber,
          subtotal,
          taxRate,
          taxAmount,
          grandTotal,
          paymentStatus: "PENDING",
          items: {
            create: billItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Update any pending bill requests for this session to BILL_GENERATED
      await tx.billRequest.updateMany({
        where: { sessionId, status: "PENDING" },
        data: { status: "BILL_GENERATED" },
      });

      return createdBill;
    });

    return NextResponse.json({
      message: "Bill generated successfully!",
      bill: finalBill,
    });
  } catch (error) {
    console.error("POST /api/restaurants/[restaurantId]/sessions/[sessionId]/bill error:", error);
    return NextResponse.json({ error: "Failed to generate bill" }, { status: 500 });
  }
}
