import { DOMAIN_COLORS } from './utils/colors';

// ---------------------------------------------------------------------------
// Re-export color maps so consumers can import everything from one place
// ---------------------------------------------------------------------------
export { DOMAIN_COLORS };

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

/** data.go.kr 공공데이터 포털 — 재정정보 OpenAPI 기본 URL */
export const DATA_GO_KR_BASE_URL = 'https://api.data.go.kr/openapi/tn_pubr_public_budget_info_api';

/** 열린재정 (openfiscaldata.go.kr) OpenAPI 기본 URL */
export const OPEN_FISCAL_DATA_BASE_URL = 'https://openapi.openfiscaldata.go.kr';

/** 열린재정 — 세출예산 현황 엔드포인트 */
export const OPEN_FISCAL_EXPENDITURE_ENDPOINT = `${OPEN_FISCAL_DATA_BASE_URL}/Expe03`;

/** 열린재정 — 세입예산 현황 엔드포인트 */
export const OPEN_FISCAL_REVENUE_ENDPOINT = `${OPEN_FISCAL_DATA_BASE_URL}/Reve03`;

// ---------------------------------------------------------------------------
// Available fiscal years
// ---------------------------------------------------------------------------

/** Fiscal years for which data is available in this application */
export const AVAILABLE_YEARS: number[] = [2023, 2024, 2025, 2026];

/** Default year to display on initial load */
export const DEFAULT_YEAR = 2026;

// ---------------------------------------------------------------------------
// Population data (단위: 명)
// Source: 통계청 장래인구추계 / 주민등록인구현황
// ---------------------------------------------------------------------------

export const POPULATION_BY_YEAR: Record<number, number> = {
  2020: 51_829_023,
  2021: 51_738_071,
  2022: 51_628_117,
  2023: 51_558_034,
  2024: 51_486_000,  // 추계치
  2025: 51_420_000,  // 추계치
  2026: 51_350_000,  // 추계치
};

// ---------------------------------------------------------------------------
// UI / pagination defaults
// ---------------------------------------------------------------------------

/** Number of search results to show per page */
export const SEARCH_PAGE_SIZE = 20;

/** Maximum depth for treemap drill-down */
export const MAX_TREEMAP_DEPTH = 5;

/** Minimum cell area (px²) below which a treemap label is hidden */
export const TREEMAP_LABEL_MIN_AREA = 2500;

// ---------------------------------------------------------------------------
// Color map reference (re-exported for convenience)
// ---------------------------------------------------------------------------

/**
 * Ordered list of domain names matching DOMAIN_COLORS keys.
 * Useful for legend rendering where insertion order matters.
 */
export const DOMAIN_NAME_ORDER: string[] = [
  '교육',
  '사회복지',
  '국방',
  '일반·지방행정',
  '공공질서·안전',
  '농림수산',
  '산업·중소기업·에너지',
  '교통·물류',
  '통신',
  '국토·지역개발',
  '과학기술',
  '환경',
  '문화·체육·관광',
  '보건',
  '외교·통일',
];
