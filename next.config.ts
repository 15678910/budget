import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 모든 응답에 크롤링/AI학습 거부 HTTP 헤더 부착 (robots.txt 무시 봇 대비 2차 방어)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // 표준 크롤러: 색인·링크추적·번역·캐시 모두 거부
            // noai, noimageai: AI 학습용 스크래핑 거부 (Adobe·Microsoft·Substack 등 채택)
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, notranslate, noai, noimageai',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
