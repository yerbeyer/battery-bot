#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# اسکریپت استارت کانتینر (production).
#
# چرا db push به‌جای migrate deploy؟
#   پروژه در فاز ۰-۱ هنوز migration ثبت‌شده ندارد و schema به‌سرعت در حال
#   تغییر است. db push مستقیماً schema.prisma را با ساختار دیتابیس یکی
#   می‌کند - بدون نیاز به فایل migration. وقتی پروژه به فاز پایدارتری
#   رسید (بعد از فاز ۲ به بعد)، مهاجرت به `prisma migrate deploy` با
#   تاریخچه‌ی رسمی migration پیشنهاد می‌شود (ثبت این تصمیم در
#   ROADMAP.md → Decision Log فراموش نشود).
# ---------------------------------------------------------------------------

echo "[start.sh] همگام‌سازی schema با دیتابیس..."
node_modules/.bin/prisma db push --accept-data-loss

echo "[start.sh] بالا آوردن سرور..."
exec node server.js
