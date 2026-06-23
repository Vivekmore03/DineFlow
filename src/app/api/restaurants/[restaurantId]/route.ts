import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/restaurants/[restaurantId]
 * Returns the restaurant record. Owner only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = await params;

    // Ensure the requesting owner owns this restaurant
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        gstNumber: true,
        taxRate: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tables: true,
            menuItems: true,
            sessions: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("GET /api/restaurants/[restaurantId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/restaurants/[restaurantId]
 * Updates restaurant profile. Owner only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only owners can update restaurant" }, { status: 403 });
    }

    const { restaurantId } = await params;

    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Dynamic import to avoid bundling zod in Edge
    const { updateRestaurantSchema } = await import("@/lib/validators");
    const result = updateRestaurantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, address, gstNumber, taxRate, currency, logo } = result.data;

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        address: address ?? null,
        gstNumber: gstNumber || null,
        taxRate,
        currency,
        logo: logo ?? undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        gstNumber: true,
        taxRate: true,
        currency: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Restaurant updated successfully",
      restaurant: updated,
    });
  } catch (error) {
    console.error("PUT /api/restaurants/[restaurantId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
