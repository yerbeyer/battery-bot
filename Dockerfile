# syntax=docker/dockerfile:1
#
# الگوی سه‌مرحله‌ای از پروژه‌ی قبلی (تسویه‌یار) گرفته شده — با این تفاوت
# که فعلاً بخش Python/WeasyPrint (برای PDF فارسی) حذف شده چون فاز ۰-۱ به
# آن نیاز ندارد. اگر در فاز ۳ گزارش PDF لازم شد، آن بخش از Dockerfile
# پروژه‌ی قبلی به همینجا برمی‌گردد (ثبت در ROADMAP.md وقتی اتفاق افتاد).

# ---------- مرحله ۱: نصب وابستگی‌ها و ساخت Prisma Client ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ---------- مرحله ۲: ساخت (build) اپلیکیشن Next.js ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- مرحله ۳: ایمیج نهایی برای اجرا ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Turbopack مسیر پروژه را در build-time با یک alias مجازی به اسم /ROOT
# هاردکد می‌کند. چون اجرای واقعی این ایمیج در /app است، این symlink از
# ENOENT روی بسته‌هایی که مسیر absolute را در runtime می‌خوانند جلوگیری
# می‌کند (همان مشکلی که در Dockerfile پروژه‌ی قبلی مستند شده بود).
RUN ln -s /app /ROOT

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# node_modules کامل (نه فقط standalone) لازم است چون prisma CLI (برای
# db push در start.sh) یک پروسه‌ی جداگانه است، نه بخشی از باندل
# standalone خودِ سرور Next.js.
COPY --from=deps /app/node_modules ./node_modules

COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./scripts/start.sh"]
