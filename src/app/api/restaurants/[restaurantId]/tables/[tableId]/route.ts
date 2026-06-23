import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTableQrUrl, generateQrSvg } from "@/lib/qr";

const updateTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(50).optional(),
  number: z.number().int().min(1).max(999).optional(),
  isActive: z.boolean().optional(),
  qrCode: z.string().nullable().optional(),
});

type RouteContext = { params: Promise<{ restaurantId: string; tableId: string }> };

/**
 * GET /api/restaurants/[restaurantId]/tables/[tableId]
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { restaurantId, tableId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      include: {
        _count: { select: { sessions: true } },
      },
    });

    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    return NextResponse.json({ table });
  } catch (error) {
    console.error("GET /tables/[tableId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/restaurants/[restaurantId]/tables/[tableId]
 * Updates name, number, or isActive. Re-generates QR if number changes.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId, tableId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateTableSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.table.findFirst({
      where: { id: tableId, restaurantId },
    });
    if (!existing) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    const { name, number, isActive, qrCode } = result.data;

    // Check duplicate number (excluding self)
    if (number !== undefined && number !== existing.number) {
      const conflict = await prisma.table.findUnique({
        where: { uq_restaurant_table_number: { restaurantId, number } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Table number ${number} already exists in this restaurant` },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (number !== undefined) updateData.number = number;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (qrCode !== undefined) updateData.qrCode = qrCode;

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: updateData,
      select: {
        id: true,
        name: true,
        number: true,
        qrCode: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: "Table updated successfully", table: updated });
  } catch (error) {
    console.error("PUT /tables/[tableId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/restaurants/[restaurantId]/tables/[tableId]
 * Hard deletes a table. Fails if there is an active dining session.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId, tableId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Guard: block deletion if there's an active or pending dining session on this table
    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: { in: ["ACTIVE", "BILL_REQUESTED"] },
      },
    });
    if (activeSession) {
      return NextResponse.json(
        { error: "Cannot delete a table with an active dining session. Close the session first." },
        { status: 409 }
      );
    }

    await prisma.table.deleteMany({ where: { id: tableId, restaurantId } });

    return NextResponse.json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error("DELETE /tables/[tableId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/restaurants/[restaurantId]/tables/[tableId]?action=regenerate-qr
 * Regenerates the QR code for a specific table.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId, tableId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const table = await prisma.table.findFirst({ where: { id: tableId, restaurantId } });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const qrUrl = buildTableQrUrl(restaurant.slug, tableId);
    const qrSvg = await generateQrSvg(qrUrl);

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { qrCode: qrSvg },
      select: { id: true, name: true, number: true, qrCode: true, isActive: true },
    });

    return NextResponse.json({ message: "QR code regenerated", table: updated });
  } catch (error) {
    console.error("PATCH /tables/[tableId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
