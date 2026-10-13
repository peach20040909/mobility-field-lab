import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "인도지킴이들 · 거리에서 찾는 답",
  description:
    "인도지킴이들 · 보행자를 위한 공유 이동수단 현장조사와 독립 검수",
  icons: { icon: (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/team-logo.svg" },
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
