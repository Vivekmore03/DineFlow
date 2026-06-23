import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMenuItemSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ restaurantId: string; itemId: string }> };

const ITEM_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  image: true,
  isAvailable: true,
  sortOrder: true,
  categoryId: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} as const;

/**
 * PUT /api/restaurants/[restaurantId]/menu-items/[itemId]
 * Updates any fields on a menu item.
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { restaurantId, itemId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateMenuItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, isDeleted: false },
    });
    if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    // If changing category, verify it belongs to this restaurant
    if (result.data.categoryId && result.data.categoryId !== existing.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: result.data.categoryId, restaurantId },
      });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const { name, description, price, image, isAvailable, sortOrder, categoryId } = result.data;

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
        ...(price !== undefined && { price }),
        ...(image !== undefined && { image: image ?? null }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(categoryId !== undefined && { categoryId }),
      },
      select: ITEM_SELECT,
    });

    return NextResponse.json({ message: "Menu item updated", item: updated });
  } catch (error) {
    console.error("PUT /menu-items/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/restaurants/[restaurantId]/menu-items/[itemId]
 * Soft-deletes the item (sets isDeleted = true) to preserve order history.
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { restaurantId, itemId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId, isDeleted: false },
    });
    if (!existing) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

    // Soft delete — preserves referential integrity with past order items
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isDeleted: true, isAvailable: false },
    });

    return NextResponse.json({ message: "Menu item deleted" });
  } catch (error) {
    console.error("DELETE /menu-items/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
