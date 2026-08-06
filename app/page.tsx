import { prisma } from "@/lib/prisma";

/**
 * صفحه‌ی اسکلت پنل مدیریتی — فاز ۰. فقط سلامت اتصال دیتابیس + تعداد
 * لاگ‌های اخیر را نشان می‌دهد تا مطمئن شویم مسیر webhook → dispatcher →
 * prisma واقعاً کار کرده. صفحات واقعی (تراکنش‌ها، انبار، گزارش‌ها) طبق
 * ROADMAP.md در فازهای بعد اضافه می‌شوند.
 */
export default async function Home() {
  let dbStatus: "ok" | "error" = "ok";
  let recentLogCount = 0;
  let sessionCount = 0;

  try {
    recentLogCount = await prisma.logEntry.count();
    sessionCount = await prisma.botSession.count();
  } catch {
    dbStatus = "error";
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">پنل مدیریتی — بات باتری‌فروشی</h1>
        <p className="text-zinc-500 mb-8">فاز ۰: اسکلت (Skeleton)</p>

        <div className="grid gap-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">وضعیت دیتابیس</span>
              <span
                className={
                  dbStatus === "ok"
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {dbStatus === "ok" ? "متصل ✅" : "خطا ❌"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">تعداد جلسات بات (BotSession)</span>
              <span>{sessionCount.toLocaleString("fa-IR")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">تعداد کل لاگ‌های ثبت‌شده</span>
              <span>{recentLogCount.toLocaleString("fa-IR")}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-500 mt-8">
          برای تست کامل: در تلگرام به بات پیام بده، بعد این صفحه را رفرش کن — باید عدد
          لاگ‌ها بالا رفته باشد. جزئیات هر لاگ فعلاً فقط از طریق{" "}
          <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">docker compose logs app</code>{" "}
          قابل مشاهده است (نمایش گرافیکی لاگ‌ها در فاز‌های بعد اضافه می‌شود).
        </p>
      </main>
    </div>
  );
}
