import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 모든 응답에 AI 학습 거부 HTTP 헤더 부착 (검색엔진 색인은 허용, AI 학습만 차단)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // noai, noimageai: AI 학습용 스크래핑 거부 신호
            //   (Adobe·Microsoft·Substack·Tumblr 등이 채택한 비공식 표준)
            // 일반 검색엔진(Googlebot·Naverbot 등)은 영향 없음 → 색인·노출 정상
            key: 'X-Robots-Tag',
            value: 'noai, noimageai',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
