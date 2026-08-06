# راهنمای دیپلوی روی Railway

> این راهنما مستقیماً از تجربه‌ی واقعی دیپلوی پروژه‌ی قبلی (تسویه‌یار) روی
> Railway گرفته شده — همان مراحل، تطبیق‌داده‌شده با این پروژه. اگر ترجیحت
> VPS شخصی است، `README.md` را ببین؛ این دو مسیر جایگزین هم‌اند، هر دو از
> همان `Dockerfile` استفاده می‌کنند و کد یکسان است.

## چرا این پروژه هم روی Railway هم روی VPS جواب می‌دهد

تصمیم معماری "یک پروژه‌ی Next.js واحد + Dockerfile استاندارد" (طبق
`ARCHITECTURE.md`) عمداً به‌گونه‌ای انتخاب شد که به هیچ سرویس خاصی قفل
نشود. Railway فقط `Dockerfile` را می‌بیند و می‌سازد — نیازی به
`docker-compose.yml` روی Railway نیست (آن فایل فقط برای اجرای لوکال/VPS
است؛ Railway خودش دیتابیس PostgreSQL را به‌عنوان یک سرویس جدا مدیریت
می‌کند).

---

## بخش ۱ — بردن کد به گیت‌هاب (فقط بار اول)

```bash
cd battery-bot
git init
git add .
git commit -m "initial"
git branch -M main
```

یک ریپوی خالی در github.com بساز (Private، بدون تیک README/.gitignore)،
بعد یک **Personal Access Token** بساز:
- github.com → عکس پروفایل → Settings → پایین‌ترین بخش: "Developer settings" → "Personal access tokens" → "Fine-grained tokens" → "Generate new token"
- Repository access: فقط همین ریپو
- Permissions → Contents → Read and write

```bash
git remote add origin https://github.com/YOUR_USERNAME/battery-bot.git
git push -u origin main
```
موقع رمز، همون توکن رو پیست کن (نه رمز اکانت گیت‌هاب).

## بخش ۲ — ساخت پروژه در Railway

- مرورگر → railway.app → "Login with GitHub"
- "New Project" → "Deploy from GitHub repo"
- اگه اولین‌باره، "Configure GitHub App" → ریپوی `battery-bot` رو تیک بزن → Save
- ریپو رو انتخاب کن — Railway خودش `Dockerfile` رو تشخیص می‌ده و می‌سازه

## بخش ۳ — اضافه‌کردن دیتابیس

داخل صفحه‌ی پروژه: دکمه‌ی **"+ New"** → "Database" → "Add PostgreSQL"

## بخش ۴ — متغیرهای محیطی

روی سرویس اصلی (`battery-bot`) → تب "Variables" → "New Variable":

| متغیر | مقدار |
|---|---|
| `DATABASE_URL` | از "Add a Variable Reference" سرویس Postgres انتخاب کن — خودکار وصل می‌شه، دستی تایپ نکن |
| `TELEGRAM_BOT_TOKEN` | توکن از @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | یک رشته‌ی تصادفی (مثلاً با `openssl rand -hex 32`) |
| `PUBLIC_BASE_URL` | فعلاً خالی بگذار — بعد از مرحله‌ی ۶ (گرفتن دامنه) پر می‌شود |

متغیرهای STT/Vision فاز ۱ (`GROQ_API_KEY`، `GEMINI_API_KEY`، `STT_PROVIDER`، `VISION_PROVIDER`) را هروقت به آن فاز رسیدی اضافه کن؛ فعلاً برای فاز ۰ لازم نیستند.

## بخش ۵ — دیپلوی

دکمه‌ی "Deploy" را بزن. چند دقیقه صبر کن. تب "Deployments" لاگ‌ها را نشان می‌دهد؛ سبز شدن یعنی موفق. (`scripts/start.sh` خودش موقع استارت `prisma db push` را اجرا می‌کند — نیازی به migration دستی نیست.)

## بخش ۶ — آدرس عمومی

Settings → پایین برو به "Networking" → "Generate Domain" → یک آدرس `xxx.up.railway.app` می‌سازد.

این آدرس را کپی کن، به `PUBLIC_BASE_URL` (در Variables) اضافه کن (مثلاً `https://xxx.up.railway.app`)، و دوباره دیپلوی کن (Railway خودش با تغییر Variable یک ری‌دیپلوی می‌زند).

## بخش ۷ — ثبت وب‌هوک

بعد از این‌که دامنه فعال شد، از روی سیستم خودت (نه روی Railway):

```bash
# .env محلی را با همان مقادیر Railway (توکن، سکرت، PUBLIC_BASE_URL) پر کن
npm run set-webhook
```

یا اگر می‌خواهی بدون نصب لوکال این کار را بکنی، می‌توانی مستقیم با curl هم بزنی:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://xxx.up.railway.app/api/bot/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## بخش ۸ — تست نهایی

```bash
curl https://xxx.up.railway.app/api/health
```

باید `{"ok":true,"db":"connected",...}` برگرداند. بعد به بات در تلگرام پیام بده — باید echo بگیری.

---

## به‌روزرسانی بعدی (بعد از هر تغییر کد)

```bash
git add .
git commit -m "توضیح تغییر"
git push
```

چون Railway به شاخه‌ی `main` وصل است، هر push خودکار یک دیپلوی جدید می‌سازد. طبق تجربه‌ی پروژه‌ی قبلی، حتماً `git status` را قبل از commit ببین — یک فایل جدید (کامپوننت/route) که commit نشود ولی چیزی به آن import کند، بیلد Railway را با «Module not found» می‌شکند.

---

## عملیات نگهداری

### پاک‌کردن کامل دیتابیس (ریست تمیز)

1. Railway → سرویس اصلی → تب Variables
2. یک متغیر بساز: `WIPE_DB_ON_BOOT` = `true`
3. Redeploy (از تب Deployments، دکمه‌ی Redeploy، یا با یک push جدید)
4. صبر کن کانتینر بالا بیاید — دیتابیس کامل پاک و از نو با schema فعلی ساخته می‌شود
5. ⚠️ **بلافاصله بعدش `WIPE_DB_ON_BOOT` را به `false` برگردان** — وگرنه هر ری‌استارت بعدی دوباره همه‌چیز را پاک می‌کند

> نکته: در فاز ۰ این پروژه هنوز `WIPE_DB_ON_BOOT` را در `scripts/start.sh` پیاده نکرده‌ایم (چون فعلاً `db push` بدون force است و داده‌ی حیاتی‌ای نداریم که نگرانش باشیم). اگر لازم شد، الگوی دقیق از `scripts/start.sh` پروژه‌ی قبلی قابل اضافه‌کردن است.

### دیدن لاگ‌ها

Railway → پروژه → سرویس → تب **Deployments** → روی آخرین دیپلوی کلیک کن برای لاگ کامل build/runtime. برای لاگ زنده‌ی سرویس در حال اجرا (نه یک دیپلوی خاص)، به تب سرویس برو و پایین بیا.

هر خط لاگ ما یک JSON با `request_id` است — برای ردیابی یک مکالمه‌ی خاص، در جعبه‌ی جست‌وجوی لاگ Railway همان `request_id` را جست‌وجو کن.

---

## مشکلات رایج (طبق تجربه‌ی واقعی پروژه‌ی قبلی)

**بیلد fail می‌شود با «Module not found»**
یک فایل جدید commit نشده ولی فایلی که به آن import دارد commit شده. `git status` بزن، هر «Untracked files» را با `git add .` اضافه کن (نه `git add -u`، که فایل‌های کاملاً جدید را نادیده می‌گیرد)، دوباره commit/push کن.

**دیپلوی سبز می‌شود ولی `/api/health` خطای db می‌دهد**
یعنی `prisma db push` در `scripts/start.sh` موفق نشده. لاگ‌های Deployments را باز کن و دنبال خط `[start.sh]` بگرد. معمولاً یا `DATABASE_URL` درست وصل نشده (باید از "Add a Variable Reference" باشد، نه دستی)، یا سرویس Postgres هنوز کامل بالا نیامده بوده.

**وب‌هوک تلگرام جواب نمی‌دهد**
مطمئن شو `PUBLIC_BASE_URL` دقیقاً همان دامنه‌ای است که Railway ساخته (بدون `/` اضافه در انتها)، و `TELEGRAM_WEBHOOK_SECRET` در هر دو جا (Variables و دستور setWebhook) یکسان است.
