import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMenuItemSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ restaurantId: string }> };

const ITEM_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  image: true,
  isAvailable: true,
  sortOrder: true,
  categoryId: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
} as const;

/**
 * GET /api/restaurants/[restaurantId]/menu-items
 * Returns all non-deleted items, grouped or flat (query param: ?categoryId=xxx).
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { restaurantId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const items = await prisma.menuItem.findMany({
      where: {
        restaurantId,
        isDeleted: false,
        ...(categoryId && { categoryId }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: ITEM_SELECT,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /menu-items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/restaurants/[restaurantId]/menu-items
 * Creates a new menu item.
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createMenuItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify category belongs to this restaurant
    const category = await prisma.category.findFirst({
      where: { id: result.data.categoryId, restaurantId },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Auto sort-order: max within category + 1
    const maxOrder = await prisma.menuItem.aggregate({
      where: { categoryId: result.data.categoryId, isDeleted: false },
      _max: { sortOrder: true },
    });

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: result.data.categoryId,
        name: result.data.name.trim(),
        description: result.data.description?.trim() ?? null,
        price: result.data.price,
        image: result.data.image ?? null,
        isAvailable: result.data.isAvailable,
        sortOrder: result.data.sortOrder || (maxOrder._max.sortOrder ?? -1) + 1,
      },
      select: ITEM_SELECT,
    });

    return NextResponse.json({ message: "Menu item created", item }, { status: 201 });
  } catch (error) {
    console.error("POST /menu-items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
