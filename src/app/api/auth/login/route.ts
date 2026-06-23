import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user and include their restaurant relationships
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        ownedRestaurant: {
          select: { id: true, slug: true, name: true },
        },
        restaurant: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Determine the restaurant context
    let restaurantId: string | null = null;
    let restaurantSlug: string | null = null;
    let restaurantName: string | null = null;

    if (user.role === "OWNER" && user.ownedRestaurant) {
      restaurantId = user.ownedRestaurant.id;
      restaurantSlug = user.ownedRestaurant.slug;
      restaurantName = user.ownedRestaurant.name;
    } else if (user.role === "KITCHEN_STAFF" && user.restaurant) {
      restaurantId = user.restaurant.id;
      restaurantSlug = user.restaurant.slug;
      restaurantName = user.restaurant.name;
    }

    // Sign JWT tokens
    const payload = {
      userId: user.id,
      role: user.role,
      restaurantId,
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Prepare response
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      restaurant: restaurantId
        ? {
            id: restaurantId,
            name: restaurantName,
            slug: restaurantSlug,
          }
        : null,
    });

    // Set JWT cookies
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
