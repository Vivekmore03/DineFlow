// ============================================================================
// QR Dine — Prisma Client Singleton
// ============================================================================
// Prevents multiple Prisma Client instances during Next.js hot-reloading
// in development. In production, a single instance is created.
//
// Usage: import { prisma } from "@/lib/prisma";
// ============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
