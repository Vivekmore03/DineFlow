import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Read variables injected by the middleware
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  const restaurantId = request.headers.get("x-restaurant-id");

  if (!userId || userRole !== "OWNER") {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "Welcome, Owner! You have successfully accessed this admin route.",
    authContext: {
      userId,
      userRole,
      restaurantId,
    },
  });
}
