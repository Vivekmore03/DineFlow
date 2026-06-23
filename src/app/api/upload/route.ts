import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only restaurant owners can upload images" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "qr-dine/logos";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert File to Uint8Array (no Buffer needed — compatible with Cloudinary helper)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, file.name, folder);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    if (error instanceof Error && error.message.includes("Cloudinary is not configured")) {
      return NextResponse.json(
        {
          error: "Image upload not configured.",
          details: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
