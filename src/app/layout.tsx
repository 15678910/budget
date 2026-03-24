import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProvider } from "@/components/providers/UserProvider";
import { Header } from "@/components/layout/Header";
import { GuidedTour } from "@/components/shared/GuidedTour";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { BudgetChatbot } from "@/components/chat/BudgetChatbot";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "대한민국 예산 시각화 | 마을살림/나라살림",
  description: "한국 정부 예산을 트리맵으로 한눈에 살펴보세요. 분야별·부처별 드릴다운, 연도 비교, 1인당 부담액 등을 제공합니다.",
  keywords: ["정부예산", "예산시각화", "트리맵", "재정", "세출", "마을살림/나라살림"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo-icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "마을살림",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <UserProvider>
            <Header />
            <main className="max-w-[1600px] mx-auto px-4 py-4">
              {children}
            </main>
            <GuidedTour />
            <AnalyticsTracker />
            <BudgetChatbot />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
