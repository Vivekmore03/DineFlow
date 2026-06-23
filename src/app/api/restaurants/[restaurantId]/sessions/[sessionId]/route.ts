import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ restaurantId: string; sessionId: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
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

    const session = await prisma.diningSession.findFirst({
      where: {
        id: sessionId,
        restaurantId,
      },
      include: {
        table: {
          select: { id: true, name: true, number: true, status: true },
        },
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
        bill: {
          include: {
            items: true,
          },
        },
        billRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Dining session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("GET /api/restaurants/[restaurantId]/sessions/[sessionId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
