import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string; tableId: string }> };

/**
 * GET /api/customer/[slug]/[tableId]/session
 *
 * Called when customer first lands on the menu page.
 * - Validates restaurant (by slug) and table.
 * - Finds or creates an ACTIVE DiningSession for the table.
 * - Returns session token (stored in localStorage), restaurant info, table info, and menu.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, tableId } = await params;

    // 1. Find restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        logo: true,
        currency: true,
        taxRate: true,
      },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Find table (must be active)
    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId: restaurant.id, isActive: true },
      select: { id: true, name: true, number: true, status: true },
    });
    if (!table) {
      return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
    }

    // 3. Find existing ACTIVE/BILL_REQUESTED session or create one
    const sessionToken = request.nextUrl.searchParams.get("token");
    let session = null;

    if (sessionToken) {
      session = await prisma.diningSession.findFirst({
        where: {
          customerToken: sessionToken,
          tableId,
          restaurantId: restaurant.id,
          status: { in: ["ACTIVE", "BILL_REQUESTED"] },
        },
        select: { id: true, customerToken: true, status: true },
      });
    }

    // If no session matches the token, check if the table already has an active session
    if (!session) {
      session = await prisma.diningSession.findFirst({
        where: {
          tableId,
          restaurantId: restaurant.id,
          status: { in: ["ACTIVE", "BILL_REQUESTED"] },
        },
        select: { id: true, customerToken: true, status: true },
      });
    }

    if (!session) {
      session = await prisma.$transaction(async (tx) => {
        const newSession = await tx.diningSession.create({
          data: {
            restaurantId: restaurant.id,
            tableId,
            status: "ACTIVE",
          },
          select: { id: true, customerToken: true, status: true },
        });

        await tx.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });

        return newSession;
      });
    } else {
      // Ensure TableStatus matches the resumed session state
      const expectedTableStatus = session.status === "BILL_REQUESTED" ? "BILL_REQUESTED" : "OCCUPIED";
      if (table.status !== expectedTableStatus) {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: expectedTableStatus },
        });
      }
    }

    // 4. Fetch full menu (categories + available items)
    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        items: {
          where: { isDeleted: false, isAvailable: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
          },
        },
      },
    });

    // Filter out empty categories
    const menu = categories.filter((c) => c.items.length > 0);

    return NextResponse.json({
      restaurant,
      table,
      session: {
        id: session.id,
        token: session.customerToken,
      },
      menu,
    });
  } catch (error) {
    console.error("GET /api/customer/session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
