/**
 * کلاینت نازک API رسمی تلگرام (BotFather) — فقط HTTP خام، بدون کتابخانه‌ی
 * سنگین مثل Telegraf. الگو از پروژه‌ی قبلی (تسویه‌یار) گرفته شده چون آنجا
 * در تولید پایدار بوده؛ اینجا بدون تغییر منطقی کپی شده، فقط بدون وابستگی
 * به مدل‌های دامنه‌ی آن پروژه.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

async function callTelegram(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram API error (${method}):`, data.description);
  }
  return data;
}

export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  keyboard?: InlineKeyboardButton[][]
) {
  return callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
  });
}

export async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  return callTelegram(token, "answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

/**
 * دانلود عکس ارسالی کاربر — تلگرام آدرس مستقیم فایل نمی‌دهد، اول باید
 * file_path را از getFile گرفت، بعد از CDN فایل تلگرام دانلود کرد.
 * در فاز ۰ استفاده نمی‌شود ولی چون در فاز ۱ (عکس باتری) بلافاصله لازم
 * می‌شود، از همین حالا طبق الگوی تست‌شده اضافه شده.
 */
export async function downloadTelegramFile(
  token: string,
  fileId: string
): Promise<{ buffer: Buffer; ext: string } | null> {
  const fileInfo = await callTelegram(token, "getFile", { file_id: fileId });
  if (!fileInfo.ok || !fileInfo.result?.file_path) return null;

  const filePath: string = fileInfo.result.file_path;
  const fileRes = await fetch(`${TELEGRAM_API_BASE}/file/bot${token}/${filePath}`);
  if (!fileRes.ok) return null;

  const arrayBuffer = await fileRes.arrayBuffer();
  const ext = filePath.split(".").pop() || "jpg";
  return { buffer: Buffer.from(arrayBuffer), ext };
}

export async function setWebhook(token: string, url: string, secretToken?: string) {
  return callTelegram(token, "setWebhook", { url, secret_token: secretToken });
}
