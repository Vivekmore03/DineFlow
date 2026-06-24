import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ restaurantId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = await params;

    // Verify restaurant ownership or staff membership
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Retrieve active and bill requested sessions
    const sessions = await prisma.diningSession.findMany({
      where: {
        restaurantId,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
      include: {
        table: {
          select: { id: true, name: true, number: true, status: true },
        },
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        bill: true,
        billRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { status: "desc" }, // BILL_REQUESTED before ACTIVE
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/restaurants/[restaurantId]/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
