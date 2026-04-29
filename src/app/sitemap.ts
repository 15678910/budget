import type { MetadataRoute } from 'next';

/**
 * Next.js 자동 생성 sitemap.xml — `https://budget.ai.kr/sitemap.xml`
 *
 * 정적 라우트만 등록 (관리자·인증 페이지·api 라우트는 제외).
 * Google·Naver·Bing 등 검색엔진이 이 파일을 통해 사이트 구조를 빠르게 파악함.
 *
 * priority 가이드:
 *   1.0 = 메인 (/)
 *   0.9 = 핵심 시뮬레이터·진단 (공약검증·재정진단)
 *   0.8 = 분석·비교 도구
 *   0.6 = 보조 페이지 (가이드·소개)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://budget.ai.kr';
  const now = new Date();

  return [
    // ── 메인 ──────────────────────────────────────
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },

    // ── 핵심 진단·시뮬레이션 ─────────────────────
    { url: `${base}/fiscal-doctor`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/promise-check`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/simulator`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/local-simulator`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/industry-sim`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // ── 시각화·분석 도구 ─────────────────────────
    { url: `${base}/table`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/regional`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/regional-compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/fiscal-health`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/fiscal-innovation`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/debt-clock`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },

    // ── 정책·비전 ────────────────────────────────
    { url: `${base}/public-bank`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/goals`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // ── 보조 ─────────────────────────────────────
    { url: `${base}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
