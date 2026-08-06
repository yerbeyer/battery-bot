# بات دستیار باتری‌فروشی (فاز ۰ — اسکلت)

> برای معماری کامل و منطق هر ماژول، `ARCHITECTURE.md` را ببین.
> برای وضعیت فعلی پروژه و فازهای بعدی، `ROADMAP.md` را ببین.

## این فاز چه می‌کند

یک بات تلگرامی زنده که پیام‌ها را echo می‌کند + یک پنل مدیریتی حداقلی که
وضعیت اتصال دیتابیس را نشان می‌دهد. هدف: اثبات این‌که کل مسیر
`Webhook → dispatcher → Prisma → لاگ` سالم کار می‌کند، قبل از اضافه کردن
هر منطق واقعی (STT/Vision/تراکنش).

## اجرای لوکال (بدون Docker)

```bash
npm install
cp .env.example .env
# .env را ویرایش کن: حداقل DATABASE_URL و TELEGRAM_BOT_TOKEN لازم است

npx prisma generate
npx prisma db push   # اسکیما را روی دیتابیس محلی اعمال می‌کند

npm run dev
```

برای تست وب‌هوک به‌صورت لوکال، تلگرام باید بتواند به سرورت HTTP بزند —
از یک ابزار tunnel (مثل ngrok) استفاده کن، آدرس عمومی موقت را در
`PUBLIC_BASE_URL` بگذار، و `npm run set-webhook` را اجرا کن.

## اجرای با Docker (پیشنهادی برای VPS)

```bash
cp .env.example .env
# .env را کامل کن

docker compose up -d --build
```

بعد از بالا آمدن (و راه‌اندازی Nginx+SSL طبق `nginx/battery-bot.conf.example`):

```bash
npm run set-webhook
```

## دیپلوی روی Railway (جایگزین VPS)

اگر ترجیحت Railway است به‌جای VPS شخصی، همین `Dockerfile` را بدون تغییر
می‌پذیرد — راهنمای کامل قدم‌به‌قدم (گرفته‌شده از تجربه‌ی واقعی پروژه‌ی
قبلی روی Railway) در `RAILWAY.md` است.

## تست سلامت

```bash
curl https://YOUR_DOMAIN/api/health
```

باید `{"ok":true,"db":"connected",...}` برگرداند.

## دیدن لاگ‌ها

```bash
docker compose logs -f app
```

هر خط یک JSON با `request_id` است — برای ردیابی یک مکالمه‌ی خاص:

```bash
docker compose logs app | grep <request_id>
```

## معیار عبور به فاز ۱

طبق `ROADMAP.md`: پیام متنی به بات بفرستی، جواب echo بگیری، و در
`docker compose logs` کل مسیر پیام از روی `request_id` قابل ردیابی باشد.
بعد از تایید این، فاز ۱ (ثبت فروش واقعی با STT/Vision) شروع می‌شود.
