import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validators";

type Ctx = { params: Promise<{ restaurantId: string }> };

/**
 * GET /api/restaurants/[restaurantId]/categories
 * Returns all categories with their item counts, ordered by sortOrder.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { restaurantId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        _count: {
          select: {
            items: { where: { isDeleted: false } },
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/restaurants/[restaurantId]/categories
 * Creates a new category. Auto-assigns next sortOrder if not provided.
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
    const result = createCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, sortOrder } = result.data;

    // Auto-assign max sortOrder + 1 if not specified
    let effectiveSortOrder = sortOrder;
    if (sortOrder === 0) {
      const maxOrder = await prisma.category.aggregate({
        where: { restaurantId },
        _max: { sortOrder: true },
      });
      effectiveSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    }

    const category = await prisma.category.create({
      data: { restaurantId, name: name.trim(), sortOrder: effectiveSortOrder },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        _count: { select: { items: { where: { isDeleted: false } } } },
      },
    });

    return NextResponse.json({ message: "Category created", category }, { status: 201 });
  } catch (error) {
    console.error("POST /categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
