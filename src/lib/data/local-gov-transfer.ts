/**
 * 시도교육청 세입 중 "지방자치단체이전수입(전입금)"
 * = 광역 지자체(도/특별시) + 기초 지자체(시군구)가 교육청에 전입하는 연간 금액.
 *   대부분 법정전입금(도세 전출 등) + 일부 비법정전입금.
 *
 * ⚠️ 데이터 출처: 지방교육재정알리미 OpenAPI는 거시 통합재정통계만 제공하고
 *   재원별(전입금) 세입을 시도별로 분리 제공하지 않습니다(2026-06 확인).
 *   따라서 각 교육청 "본예산 재정공시" 수치를 수기 검증해 등재합니다.
 *   미검증 시도는 null → UI에서 "재정공시 확인"으로 honest 처리(추정/날조 금지).
 *
 * 단위: 억원
 */
export interface LocalGovTransfer {
  y2026: number | null; // 2026 본예산 지방자치단체이전수입
  y2025: number | null; // 2025 본예산(비교)
  source: string;       // 출처
}

// 시도 약칭 기준
export const LOCAL_GOV_TRANSFER: Record<string, LocalGovTransfer> = {
  강원: { y2026: 3781, y2025: 3559, source: '강원특별자치도교육청 2026 본예산 재정공시' },
  // 이하 16개 시도: 각 교육청 본예산 재정공시 검증 후 등재 예정
  서울: { y2026: null, y2025: null, source: '' },
  부산: { y2026: null, y2025: null, source: '' },
  대구: { y2026: null, y2025: null, source: '' },
  인천: { y2026: null, y2025: null, source: '' },
  광주: { y2026: null, y2025: null, source: '' },
  대전: { y2026: null, y2025: null, source: '' },
  울산: { y2026: null, y2025: null, source: '' },
  세종: { y2026: null, y2025: null, source: '' },
  경기: { y2026: null, y2025: null, source: '' },
  충북: { y2026: null, y2025: null, source: '' },
  충남: { y2026: null, y2025: null, source: '' },
  전북: { y2026: null, y2025: null, source: '' },
  전남: { y2026: null, y2025: null, source: '' },
  경북: { y2026: null, y2025: null, source: '' },
  경남: { y2026: null, y2025: null, source: '' },
  제주: { y2026: null, y2025: null, source: '' },
};

/** 억원 → 표시 문자열 (조/억 자동) */
export function formatTransfer(eok: number): string {
  if (eok >= 10000) return `${(eok / 10000).toFixed(2)}조`;
  return `${eok.toLocaleString()}억`;
}
