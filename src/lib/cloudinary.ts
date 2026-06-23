// ============================================================================
// QR Dine — Cloudinary Upload Helper
// ============================================================================
// Provides a server-side upload utility that returns a secure Cloudinary URL.
// Falls back gracefully when Cloudinary env vars are not configured.
// ============================================================================

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Uploads a file Buffer to Cloudinary via unsigned upload API.
 * Returns a structured result containing the secure URL and metadata.
 */
export async function uploadToCloudinary(
  fileBuffer: Uint8Array,
  filename: string,
  folder: string = "qr-dine"
): Promise<CloudinaryUploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file."
    );
  }

  // Build a signed upload request
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  // Generate HMAC-SHA1 signature using Web Crypto API (Edge-compatible)
  const keyData = new TextEncoder().encode(CLOUDINARY_API_SECRET);
  const messageData = new TextEncoder().encode(paramsToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Build multipart form data
  const formData = new FormData();
  // Use the underlying ArrayBuffer to satisfy strict Blob constructor typing
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
  formData.append("file", blob, filename);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Deletes an image from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;

  const keyData = new TextEncoder().encode(CLOUDINARY_API_SECRET);
  const messageData = new TextEncoder().encode(paramsToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const deleteUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

  await fetch(deleteUrl, {
    method: "POST",
    body: formData,
  });
}
