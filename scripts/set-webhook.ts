/**
 * اسکریپت یک‌باره برای ثبت آدرس وب‌هوک نزد تلگرام.
 *
 * استفاده (بعد از این‌که app روی VPS با دامنه/SSL بالا آمد):
 *   npx tsx scripts/set-webhook.ts
 *
 * پیش‌نیاز: TELEGRAM_BOT_TOKEN، TELEGRAM_WEBHOOK_SECRET، و PUBLIC_BASE_URL
 * باید در .env (یا محیط اجرا) ست شده باشند.
 */
import { setWebhook } from "../lib/bot/telegramApi";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.env.PUBLIC_BASE_URL;

  if (!token) {
    console.error("خطا: TELEGRAM_BOT_TOKEN تنظیم نشده.");
    process.exit(1);
  }
  if (!baseUrl) {
    console.error("خطا: PUBLIC_BASE_URL تنظیم نشده (مثلاً https://battery-bot.example.com).");
    process.exit(1);
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/bot/webhook`;
  console.log(`در حال ثبت وب‌هوک: ${webhookUrl}`);

  const result = await setWebhook(token, webhookUrl, secret);
  if (result.ok) {
    console.log("✅ وب‌هوک با موفقیت ثبت شد.");
  } else {
    console.error("❌ ثبت وب‌هوک ناموفق بود:", result.description);
    process.exit(1);
  }
}

main();
