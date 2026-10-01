import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Mobility Field Lab · 거리에서 찾는 답",
  description: "공유 이동수단 현장조사와 독립 검수 · 해외탐방 프로젝트",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
