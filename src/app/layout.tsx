import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProvider } from "@/components/providers/UserProvider";
import { Header } from "@/components/layout/Header";
import { LazyOverlays } from "@/components/layout/LazyOverlays";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://budget.ai.kr"),
  title: {
    default: "마을살림/나라살림 | 대한민국 예산·재정 시각화",
    template: "%s | 마을살림/나라살림",
  },
  description:
    "대한민국 정부·지자체·교육청 예산을 트리맵으로 한눈에. 재정 건전성 진단·공약 비용 검증·정책 시뮬레이션·지역 비교를 AI가 도와드립니다.",
  keywords: [
    "정부예산", "예산시각화", "재정 건전성", "공약 검증", "정책 시뮬레이션",
    "지방재정", "교육청 예산", "트리맵", "국가채무", "주민세",
    "나라살림", "마을살림", "재정자립도", "공공은행", "지역화폐",
  ],
  authors: [{ name: "마을살림/나라살림" }],
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://budget.ai.kr",
  },

  // 검색엔진 인증 (env 변수로 키 주입 — Vercel에서 설정)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NAVER_SITE_VERIFICATION ?? "",
    },
  },

  // 검색엔진 색인은 허용 (시민 접근성 확보), AI 학습 거부는 robots.txt + X-Robots-Tag 가 담당
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  // Open Graph: 카카오톡·트위터·페이스북 등에 링크 공유 시 미리보기 카드
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://budget.ai.kr",
    siteName: "마을살림/나라살림",
    title: "마을살림/나라살림 | 대한민국 예산·재정 시각화",
    description:
      "대한민국 정부·지자체·교육청 예산을 트리맵으로 한눈에. 재정 건전성 진단·공약 비용 검증·정책 시뮬레이션을 AI가 도와드립니다.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "마을살림/나라살림",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "마을살림/나라살림 | 대한민국 예산·재정 시각화",
    description:
      "정부·지자체·교육청 예산을 트리맵으로 한눈에. 공약 검증·정책 시뮬레이션 by AI.",
    images: ["/icon-512.png"],
  },

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
            <LazyOverlays />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
