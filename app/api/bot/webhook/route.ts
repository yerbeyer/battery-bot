import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage, handleCallback, type BotClient } from "@/lib/bot/dispatcher";
import {
  sendMessage as tgSendMessage,
  answerCallbackQuery as tgAnswerCallback,
  downloadTelegramFile,
  type InlineKeyboardButton,
} from "@/lib/bot/telegramApi";
import { newRequestId, logger } from "@/lib/logger";

/**
 * POST /api/bot/webhook
 *
 * دریافت‌کننده‌ی آپدیت‌های تلگرام. طبق ARCHITECTURE.md بخش ۲، این فقط لایه‌ی
 * نازک تبدیل payload تلگرام ↔ رابط عمومی BotClient/dispatcher است — هیچ
 * منطق دامنه (پردازش AI، ذخیره‌ی تراکنش و...) اینجا نیست.
 *
 * اعتبارسنجی امنیتی: تلگرام موقع setWebhook یک secret_token می‌گیرد و آن
 * را در هر آپدیت با هدر X-Telegram-Bot-Api-Secret-Token برمی‌گرداند. اگر
 * این هدر با TELEGRAM_WEBHOOK_SECRET یکی نباشد، درخواست رد می‌شود — وگرنه
 * هرکسی که آدرس وب‌هوک را حدس بزند می‌تواند پیام/دکمه‌ی جعلی بفرستد.
 * (الگو از app/api/bot/webhook/telegram/route.ts پروژه‌ی قبلی.)
 */
export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  logger.start(requestId, "webhook", "incoming telegram update");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.error(requestId, "webhook", "TELEGRAM_BOT_TOKEN not configured");
    // به تلگرام همیشه 200 برمی‌گردانیم وگرنه تلگرام مدام retry می‌کند
    return NextResponse.json({ ok: true });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = req.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== webhookSecret) {
      logger.error(requestId, "webhook", "invalid webhook secret token");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const client: BotClient = {
    async sendMessage(chatId, text, buttons) {
      const keyboard: InlineKeyboardButton[][] | undefined = buttons?.map((row) =>
        row.map((b) => ({ text: b.text, callback_data: b.data }))
      );
      await tgSendMessage(token, chatId, text, keyboard);
    },
    async downloadPhoto(fileId) {
      return downloadTelegramFile(token, fileId);
    },
  };

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    logger.error(requestId, "webhook", "failed to parse update JSON");
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.callback_query) {
      const cq = update.callback_query as {
        id: string;
        data?: string;
        message?: { chat: { id: number } };
        from: { id: number };
      };
      const chatId = String(cq.message?.chat.id ?? cq.from.id);
      await tgAnswerCallback(token, cq.id);
      if (cq.data) {
        await handleCallback(client, chatId, cq.data, requestId);
      }
      return NextResponse.json({ ok: true });
    }

    if (update.message) {
      const msg = update.message as {
        chat: { id: number };
        text?: string;
        photo?: { file_id: string }[];
      };
      const chatId = String(msg.chat.id);
      const text = msg.text?.trim() || null;
      const photoFileId = msg.photo?.length ? msg.photo[msg.photo.length - 1].file_id : null;

      await handleIncomingMessage(client, chatId, text, photoFileId, requestId);
    }
  } catch (err) {
    logger.error(requestId, "webhook", "unhandled error processing update", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }

  logger.success(requestId, "webhook", "update processed");
  return NextResponse.json({ ok: true });
}

// جلوگیری از خطا اگر کسی مستقیم GET بزند (مثلاً برای تست دستی سلامت روت)
export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook is live" });
}
