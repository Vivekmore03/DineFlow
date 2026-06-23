import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validators";

type Ctx = { params: Promise<{ restaurantId: string; categoryId: string }> };

/**
 * PUT /api/restaurants/[restaurantId]/categories/[categoryId]
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { restaurantId, categoryId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({ where: { id: categoryId, restaurantId } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(result.data.name !== undefined && { name: result.data.name.trim() }),
        ...(result.data.sortOrder !== undefined && { sortOrder: result.data.sortOrder }),
      },
      select: {
        id: true, name: true, sortOrder: true,
        _count: { select: { items: { where: { isDeleted: false } } } },
      },
    });

    return NextResponse.json({ message: "Category updated", category: updated });
  } catch (error) {
    console.error("PUT /categories/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/restaurants/[restaurantId]/categories/[categoryId]
 * Blocks deletion if the category contains non-deleted menu items.
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { restaurantId, categoryId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const itemCount = await prisma.menuItem.count({
      where: { categoryId, isDeleted: false },
    });

    if (itemCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${itemCount} active menu item${itemCount > 1 ? "s" : ""}. Move or delete items first.`,
        },
        { status: 409 }
      );
    }

    await prisma.category.deleteMany({ where: { id: categoryId, restaurantId } });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /categories/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
