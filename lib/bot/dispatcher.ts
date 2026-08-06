import { prisma } from "@/lib/prisma";
import { logger, type LogModule } from "@/lib/logger";

/**
 * موتور مکالمه‌ی بات — مستقل از پلتفرم، طبق الگوی تسویه‌یار
 * (lib/bot/dispatcher.ts آن پروژه). هر پیام‌رسان (تلگرام، بعداً شاید بله)
 * یک BotClient پیاده می‌کند و همین فایل را صدا می‌زند، تا منطق مکالمه
 * یک‌بار نوشته شود و به جزئیات HTTP تلگرام وابسته نباشد.
 *
 * فاز ۰: فقط echo + چند دستور پایه، برای اثبات این‌که کل مسیر
 * webhook → dispatcher → prisma → پاسخ، سالم کار می‌کند. منطق واقعی
 * (STT/Vision/تایید تراکنش) در فاز ۱ به همین‌جا اضافه می‌شود، نه جای دیگر.
 */

export interface BotClient {
  sendMessage(chatId: string, text: string, buttons?: { text: string; data: string }[][]): Promise<void>;
  downloadPhoto(fileId: string): Promise<{ buffer: Buffer; ext: string } | null>;
}

const MODULE: LogModule = "dispatcher";

async function getOrCreateSession(chatId: string) {
  const existing = await prisma.botSession.findUnique({ where: { chatId } });
  if (existing) return existing;
  return prisma.botSession.create({ data: { chatId, state: "IDLE" } });
}

/** ورودی اصلی برای پیام‌های متنی/عکس معمولی (نه دکمه‌ها) */
export async function handleIncomingMessage(
  client: BotClient,
  chatId: string,
  text: string | null,
  photoFileId: string | null,
  requestId: string
): Promise<void> {
  logger.start(requestId, MODULE, "incoming message", { chatId, hasText: !!text, hasPhoto: !!photoFileId });

  const session = await getOrCreateSession(chatId);
  const trimmed = (text || "").trim();

  if (trimmed === "/start") {
    await prisma.botSession.update({ where: { id: session.id }, data: { state: "IDLE", contextJson: null } });
    await client.sendMessage(
      chatId,
      "سلام 👋 به بات دستیار باتری‌فروشی خوش اومدی.\n\nفعلاً این بات در فاز اسکلت‌بندی (Phase 0) است — فقط echo می‌کند تا مطمئن شویم اتصال درست کار می‌کند.\n\nهر متنی بفرستی، همان را برات برمی‌گردونم. با /ping هم می‌تونی سلامت سیستم رو چک کنی."
    );
    logger.success(requestId, MODULE, "start command handled", { chatId });
    return;
  }

  if (trimmed === "/cancel") {
    await prisma.botSession.update({ where: { id: session.id }, data: { state: "IDLE", contextJson: null } });
    await client.sendMessage(chatId, "لغو شد. وضعیت به حالت اولیه برگشت.");
    logger.success(requestId, MODULE, "cancel command handled", { chatId });
    return;
  }

  if (trimmed === "/ping") {
    await client.sendMessage(chatId, `پونگ ✅\nrequest_id: ${requestId}\nstate فعلی: ${session.state}`);
    logger.success(requestId, MODULE, "ping command handled", { chatId });
    return;
  }

  if (photoFileId) {
    await client.sendMessage(
      chatId,
      "عکس رو گرفتم 📷 — پردازش تصویر هنوز فعال نیست (این قابلیت در فاز ۱ اضافه می‌شود)."
    );
    logger.success(requestId, MODULE, "photo received (phase 0 — no processing)", { chatId, photoFileId });
    return;
  }

  if (trimmed) {
    await client.sendMessage(chatId, `دریافت شد: «${trimmed}»\n(این فاز فقط echo می‌کند)`);
    logger.success(requestId, MODULE, "text echoed", { chatId });
    return;
  }

  await client.sendMessage(chatId, "پیام خالی دریافت شد — چیزی بفرست تا جواب بدم.");
  logger.success(requestId, MODULE, "empty message handled", { chatId });
}

/** ورودی برای دکمه‌های شیشه‌ای (callback query) — در فاز ۰ هنوز استفاده نمی‌شود */
export async function handleCallback(
  client: BotClient,
  chatId: string,
  data: string,
  requestId: string
): Promise<void> {
  logger.start(requestId, MODULE, "incoming callback", { chatId, data });
  await client.sendMessage(chatId, `دکمه دریافت شد: ${data}\n(در فاز ۰ منطق دکمه‌ها هنوز پیاده نشده)`);
  logger.success(requestId, MODULE, "callback echoed", { chatId });
}
