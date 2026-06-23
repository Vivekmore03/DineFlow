import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyResetToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Verify token
    const tokenPayload = await verifyResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Retrieve user
    const user = await prisma.user.findUnique({
      where: { email: tokenPayload.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User associated with this token not found" },
        { status: 404 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
