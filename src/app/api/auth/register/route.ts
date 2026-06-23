import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name, restaurantName } = result.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Generate unique slug for restaurant
    let slug = slugify(restaurantName);
    let count = 0;
    while (true) {
      const currentSlug = count === 0 ? slug : `${slug}-${count}`;
      const existingRestaurant = await prisma.restaurant.findUnique({
        where: { slug: currentSlug },
      });
      if (!existingRestaurant) {
        slug = currentSlug;
        break;
      }
      count++;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and restaurant in transaction (1:1 relationship)
    const { user, restaurant } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          name,
          role: "OWNER",
        },
      });

      const createdRestaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          slug,
          ownerId: createdUser.id,
        },
      });

      return { user: createdUser, restaurant: createdRestaurant };
    });

    // Sign JWT tokens
    const payload = {
      userId: user.id,
      role: user.role,
      restaurantId: restaurant.id,
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Prepare response
    const response = NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        },
      },
      { status: 201 }
    );

    // Set JWT cookies
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
