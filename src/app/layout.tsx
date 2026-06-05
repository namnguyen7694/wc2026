import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Lịch Thi Đấu World Cup 2026 | Bảng Điểm & Giả Lập Tỉ Số Tự Động",
  description:
    "Trực quan hóa lịch thi đấu FIFA World Cup 2026, cập nhật từ VNExpress. Hỗ trợ giả lập tỷ số, tự động tính toán bảng xếp hạng 12 bảng đấu và vẽ sơ đồ nhánh loại trực tiếp (knockout) thời gian thực.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
