import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health — بررسی سلامت اپ + اتصال دیتابیس. طبق فاز ۰ ROADMAP.md:
 * "معیار عبور به فاز بعد" شامل بالا آمدن موفق app + db روی VPS است؛ این
 * endpoint دقیقاً همان چک را قابل تایید با یک curl ساده می‌کند.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: "disconnected", error: err instanceof Error ? err.message : String(err) },
      { status: 503 }
    );
  }
}
