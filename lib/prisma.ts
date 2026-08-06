import { PrismaClient } from "@prisma/client";

/**
 * نقطه‌ی واحد دسترسی به دیتابیس (طبق ARCHITECTURE.md بخش ۲). هیچ ماژول
 * دیگری نباید مستقیم `new PrismaClient()` بسازد.
 *
 * الگوی global در dev برای جلوگیری از باز شدن چندباره‌ی کانکشن به خاطر
 * hot-reload لازم است (استاندارد رسمی Prisma+Next.js).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
