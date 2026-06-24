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

    // Verify restaurant membership
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const statusParam = request.nextUrl.searchParams.get("status"); // PAID or PENDING
    const whereClause: any = { restaurantId };

    if (statusParam) {
      whereClause.paymentStatus = statusParam;
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("GET /api/restaurants/[restaurantId]/bills error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
