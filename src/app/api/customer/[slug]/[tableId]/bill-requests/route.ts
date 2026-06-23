import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket-emitter";
import { eventEmitter, EVENTS } from "@/lib/events";

type Ctx = { params: Promise<{ slug: string; tableId: string }> };

const billRequestSchema = z.object({
  sessionToken: z.string().min(1, "Session token required"),
});

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, tableId } = await params;

    const body = await request.json();
    const parsed = billRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sessionToken } = parsed.data;

    // 1. Verify restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Verify active dining session
    const session = await prisma.diningSession.findFirst({
      where: {
        customerToken: sessionToken,
        tableId,
        restaurantId: restaurant.id,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
      select: { id: true, status: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Active dining session not found or already completed." },
        { status: 403 }
      );
    }

    // 3. If already bill requested, return success immediately
    if (session.status === "BILL_REQUESTED") {
      return NextResponse.json({
        message: "Bill request already pending.",
        sessionId: session.id,
      });
    }

    // 4. Create bill request and update statuses transactionally
    const billRequest = await prisma.$transaction(async (tx) => {
      // Create BillRequest record
      const br = await tx.billRequest.create({
        data: {
          restaurantId: restaurant.id,
          sessionId: session.id,
          status: "PENDING",
        },
      });

      // Update DiningSession status
      await tx.diningSession.update({
        where: { id: session.id },
        data: { status: "BILL_REQUESTED" },
      });

      // Update Table status
      await tx.table.update({
        where: { id: tableId },
        data: { status: "BILL_REQUESTED" },
      });

      return br;
    });

    const tableInfo = await prisma.table.findUnique({
      where: { id: tableId },
      select: { name: true, number: true },
    });

    if (tableInfo) {
      const payload = {
        id: billRequest.id,
        table: tableInfo,
        sessionId: session.id,
        status: "PENDING",
      };

      eventEmitter.emit(EVENTS.BILL_REQUEST, {
        restaurantId: restaurant.id,
        billRequest: payload,
      });

      await emitSocketEvent(`restaurant:${restaurant.id}`, "bill_request", payload);
    }

    return NextResponse.json({
      message: "Bill requested successfully! Staff will bring the bill shortly.",
      sessionId: session.id,
    });
  } catch (error) {
    console.error("POST /api/customer/bill-requests error:", error);
    return NextResponse.json({ error: "Failed to request bill" }, { status: 500 });
  }
}
