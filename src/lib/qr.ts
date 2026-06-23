// ============================================================================
// QR Dine — QR Code Generation Utility
// ============================================================================
// Generates QR codes as SVG strings (for DB storage / inline display)
// and PNG data URLs (for download).
// ============================================================================

import QRCode from "qrcode";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Environment variable NEXT_PUBLIC_APP_URL is required in production.");
}

/**
 * Build the QR code URL for a specific table.
 * Format: {NEXT_PUBLIC_APP_URL}/r/{slug}/t/{tableId}
 */
export function buildTableQrUrl(slug: string, tableId: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${appUrl}/r/${slug}/t/${tableId}`;
}

/**
 * Generate a QR code as an SVG string.
 * Suitable for inline display and storage in the database.
 */
export async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * Generate a QR code as a PNG data URL (base64).
 * Suitable for downloading as an image file.
 */
export async function generateQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: "image/png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

/**
 * Trigger a browser download of the QR code PNG.
 * Call this client-side with the QR data URL.
 */
export function downloadQrPng(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
  a.remove();
}

/**
 * Trigger a browser download of the QR code as an SVG file.
 */
export function downloadQrSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
