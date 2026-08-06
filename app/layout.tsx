import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

// فونت وزیرمتن برای نمایش درست فارسی در پنل مدیریتی (طبق الگوی پروژه‌ی
// قبلی که همین فونت را برای رسیدهای PDF فارسی هم استفاده می‌کرد).
const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "پنل مدیریتی — بات باتری‌فروشی",
  description: "پنل مدیریتی و وب‌هوک بات تلگرامی حسابداری/انبار باتری‌فروشی",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
