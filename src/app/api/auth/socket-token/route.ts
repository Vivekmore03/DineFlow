import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, signSocketToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.restaurantId) {
      return NextResponse.json({ error: "No restaurant associated with user" }, { status: 400 });
    }

    const token = await signSocketToken({
      role: "staff",
      restaurantId: user.restaurantId,
      userId: user.userId,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating staff socket token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
