import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // To prevent user enumeration, always say success. 
    // But return token only if user actually exists for local testing/verification.
    if (!user) {
      return NextResponse.json({
        message: "If the email is registered, a password reset link has been simulated.",
      });
    }

    const resetToken = await signResetToken(user.email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    return NextResponse.json({
      message: "If the email is registered, a password reset link has been simulated.",
      // Exposed for testing/MVP development to bypass SMTP configuration
      debug: {
        resetToken,
        resetUrl,
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
