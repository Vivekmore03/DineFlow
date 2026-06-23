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

    // 1. Fetch session and its table to close
    const session = await prisma.diningSession.findFirst({
      where: { id: sessionId, restaurantId },
      include: {
        table: true,
        bill: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Dining session not found" }, { status: 404 });
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({ error: "Session is already completed" }, { status: 400 });
    }

    // 2. Ensure bill exists before closing
    if (!session.bill) {
      return NextResponse.json(
        { error: "Cannot close session. Bill must be generated first." },
        { status: 400 }
      );
    }

    // 3. Mark paid and release table transactionally
    await prisma.$transaction(async (tx) => {
      // Mark bill as PAID
      await tx.bill.update({
        where: { id: session.bill!.id },
        data: { paymentStatus: "PAID" },
      });

      // Complete DiningSession
      await tx.diningSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" },
      });

      // Set Table as AVAILABLE
      await tx.table.update({
        where: { id: session.tableId },
        data: { status: "AVAILABLE" },
      });

      // Complete all bill requests
      await tx.billRequest.updateMany({
        where: { sessionId },
        data: { status: "COMPLETED" },
      });
    });

    return NextResponse.json({
      message: "Session closed and table marked as available successfully!",
    });
  } catch (error) {
    console.error("POST /api/restaurants/[restaurantId]/sessions/[sessionId]/close error:", error);
    return NextResponse.json({ error: "Failed to close session" }, { status: 500 });
  }
}
