import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // خروجی standalone برای Docker لازم است: فقط فایل‌های واقعاً استفاده‌شده
  // را در .next/standalone کپی می‌کند، نه کل node_modules (طبق الگوی
  // Dockerfile پروژه‌ی قبلی).
  output: "standalone",
};

export default nextConfig;
