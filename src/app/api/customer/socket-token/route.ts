import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSocketToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { sessionToken, restaurantId, tableId } = await request.json();

    if (!sessionToken || !restaurantId || !tableId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Verify session is active or bill requested
    const session = await prisma.diningSession.findFirst({
      where: {
        customerToken: sessionToken,
        restaurantId,
        tableId,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const token = await signSocketToken({
      role: "customer",
      restaurantId,
      tableId,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating customer socket token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
