import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * لاگر مرکزی — استاندارد دقیقاً طبق ARCHITECTURE.md بخش ۵.
 *
 * هر پیام ورودی یک request_id می‌گیرد که تا انتهای مسیر (موفق یا خطا) در
 * همه‌ی لاگ‌های مرتبط تکرار می‌شود. این تنها راهی است که روی VPS (بدون
 * دیباگر گرافیکی) می‌شود فهمید یک تراکنش خراب دقیقاً کجا شکسته:
 *
 *   docker compose logs app | grep <request_id>
 *
 * همچنین در جدول LogEntry هم ذخیره می‌شود تا در آینده از پنل مدیریتی هم
 * قابل مشاهده باشد (فاز ۰: فقط ثبت؛ نمایش در UI بعداً).
 */

export type LogLevel = "INFO" | "WARN" | "ERROR";
export type LogModule =
  | "webhook"
  | "dispatcher"
  | "stt"
  | "vision"
  | "parser"
  | "prisma"
  | "inventory";
export type LogStep = "start" | "success" | "fallback" | "error";

export function newRequestId(): string {
  return randomUUID();
}

interface LogParams {
  level: LogLevel;
  requestId: string;
  module: LogModule;
  step: LogStep;
  message: string;
  meta?: Record<string, unknown>;
}

/**
 * لاگ اصلی: همیشه یک خط JSON به stdout می‌نویسد (برای docker logs)، و به‌صورت
 * fire-and-forget در دیتابیس هم ثبت می‌کند. اگر نوشتن در دیتابیس خودش خطا
 * داد، هرگز کل درخواست را fail نمی‌کند — لاگ نباید هیچ‌وقت باعث خرابی
 * جریان اصلی برنامه شود.
 */
export function log(params: LogParams): void {
  const entry = {
    level: params.level,
    request_id: params.requestId,
    module: params.module,
    step: params.step,
    message: params.message,
    meta: params.meta ?? {},
    timestamp: new Date().toISOString(),
  };

  // stdout: منبع اصلی حقیقت روی VPS با docker compose logs
  const line = JSON.stringify(entry);
  if (params.level === "ERROR") {
    console.error(line);
  } else if (params.level === "WARN") {
    console.warn(line);
  } else {
    console.log(line);
  }

  // ذخیره در دیتابیس - fire and forget عمدی (نباید جریان اصلی را کند/خراب کند)
  prisma.logEntry
    .create({
      data: {
        requestId: params.requestId,
        level: params.level,
        module: params.module,
        step: params.step,
        message: params.message,
        metaJson: params.meta ? JSON.stringify(params.meta) : null,
      },
    })
    .catch((err: unknown) => {
      // اگر خودِ لاگ‌نویسی در دیتابیس خطا داد، فقط در stdout هشدار می‌دهیم -
      // throw نمی‌کنیم چون لاگ نباید هیچ‌وقت جریان اصلی را بشکند.
      console.error(
        JSON.stringify({
          level: "ERROR",
          request_id: params.requestId,
          module: "prisma",
          step: "error",
          message: "log persistence failed",
          meta: { originalMessage: params.message, error: String(err) },
          timestamp: new Date().toISOString(),
        })
      );
    });
}

/** میانبرهای رایج برای خوانایی بیشتر در محل فراخوانی */
export const logger = {
  start: (requestId: string, module: LogModule, message: string, meta?: Record<string, unknown>) =>
    log({ level: "INFO", requestId, module, step: "start", message, meta }),
  success: (requestId: string, module: LogModule, message: string, meta?: Record<string, unknown>) =>
    log({ level: "INFO", requestId, module, step: "success", message, meta }),
  fallback: (requestId: string, module: LogModule, message: string, meta?: Record<string, unknown>) =>
    log({ level: "WARN", requestId, module, step: "fallback", message, meta }),
  error: (requestId: string, module: LogModule, message: string, meta?: Record<string, unknown>) =>
    log({ level: "ERROR", requestId, module, step: "error", message, meta }),
};
