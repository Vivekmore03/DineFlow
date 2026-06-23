import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTableQrUrl, generateQrSvg } from "@/lib/qr";

const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(50),
  number: z.number().int().min(1, "Table number must be at least 1").max(999),
});

/**
 * GET /api/restaurants/[restaurantId]/tables
 * Returns all tables for the restaurant, ordered by table number.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { restaurantId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: "asc" },
      select: {
        id: true,
        name: true,
        number: true,
        qrCode: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            sessions: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("GET /tables error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/restaurants/[restaurantId]/tables
 * Creates a new table and auto-generates its QR code SVG.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only owners can manage tables" }, { status: 403 });
    }

    const { restaurantId } = await params;
    if (user.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createTableSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, number } = result.data;

    // Check for duplicate table number
    const existing = await prisma.table.findUnique({
      where: { uq_restaurant_table_number: { restaurantId, number } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Table number ${number} already exists in this restaurant` },
        { status: 409 }
      );
    }

    // Get restaurant slug for QR URL
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Create table first to get the ID
    const table = await prisma.table.create({
      data: { restaurantId, name: name.trim(), number },
    });

    // Generate QR code SVG using the table's ID
    const qrUrl = buildTableQrUrl(restaurant.slug, table.id);
    const qrSvg = await generateQrSvg(qrUrl);

    // Update the table with the QR code
    const updatedTable = await prisma.table.update({
      where: { id: table.id },
      data: { qrCode: qrSvg },
      select: {
        id: true,
        name: true,
        number: true,
        qrCode: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Table created successfully", table: updatedTable },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /tables error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
