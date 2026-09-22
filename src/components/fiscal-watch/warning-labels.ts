/**
 * 조기경보 지표판의 한국어 라벨·색상·서식 헬퍼.
 *
 * 여기에는 판정이 없다. 법정 기준 충족 여부(`SignalLevel`)는 `src/lib/watch/legal-thresholds.ts`가
 * 계산한 결과를 그대로 표기할 뿐이고, 기준 충족은 지정이 아니다 —
 * 지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량이다.
 */
import { LEGAL_THRESHOLDS } from '@/lib/watch/legal-thresholds';
import type { EntitySummary, LegalIndicator, SignalLevel } from '@/lib/watch/signal-types';

export const SIGNAL_LABEL: Record<SignalLevel, string> = {
  critical: '심각',
  caution: '주의',
  normal: '해당 없음',
  'no-data': '자료 없음',
};

export const SIGNAL_CLASS: Record<SignalLevel, string> = {
  critical: 'border-red-500/50 bg-red-500/10 text-red-300',
  caution: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  normal: 'border-gray-800 bg-gray-900/60 text-gray-400',
  'no-data': 'border-dashed border-gray-700 bg-gray-900 text-gray-600',
};

/** 원자료 시도 약칭(`IndicatorEntity.region`) 17개, 화면 표시 순서 */
export const REGIONS: readonly string[] = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

/**
 * 시도 약칭 → 사이트 광역 이름.
 * `src/lib/data/fiscal-health-official.ts`의 `METRO_REGION_ABBR`를 뒤집은 값이다
 * (같은 약칭 표를 쓰지 않으면 채무비율 이력을 조회할 수 없다).
 */
export const REGION_FULL_NAME: Record<string, string> = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};

/** 시도 약칭 → 행정표준코드 2자리(사례 데이터 `WatchCase.gov.code`와 맞춘다) */
export const SIDO_CODE: Record<string, string> = {
  서울: '11', 부산: '26', 대구: '27', 인천: '28', 광주: '29', 대전: '30',
  울산: '31', 세종: '36', 경기: '41', 강원: '42', 충북: '43', 충남: '44',
  전북: '45', 전남: '46', 경북: '47', 경남: '48', 제주: '50',
};

export function sidoCodeOf(region: string): string | undefined {
  return SIDO_CODE[region];
}

/** 카드·표에 쓰는 자치단체 이름. 광역은 시도 약칭, 기초는 '시도 자치단체명' */
export function entityLabel(summary: Pick<EntitySummary, 'region' | 'name' | 'level'>): string {
  return summary.level === 'metro' ? summary.region : `${summary.region} ${summary.name}`;
}

/** 비율(%). 값이 없으면 '—' */
export function formatPct(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

/** 금액(억원). signed면 부호를 붙인다. 값이 없으면 '—' */
export function formatEok(value: number | null, signed = false): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억원`;
}

/** 채무 순증의 부호 색. 늘면 red, 줄면 emerald, 자료가 없으면 muted */
export function deltaClass(value: number | null): string {
  if (value === null) return 'text-gray-600';
  if (value > 0) return 'text-red-300';
  if (value < 0) return 'text-emerald-300';
  return 'text-gray-400';
}

/**
 * 법정 「주의」 기준까지 남은 폭(%p). 양수면 기준 밖, 0 이하면 기준 안.
 * direction 'above' 지표는 (주의 하한 − 값), 'below' 지표는 (값 − 주의 상한).
 * 통합재정수지비율은 조문대로 음의 값의 절대값에 적용한다(흑자는 대상이 아니다).
 * 값이 없으면 null.
 */
export function headroomToCaution(indicator: LegalIndicator, value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const threshold = LEGAL_THRESHOLDS[indicator];
  const target = indicator === 'fiscalBalance' ? (value < 0 ? Math.abs(value) : 0) : value;
  const gap =
    threshold.direction === 'above' ? threshold.caution[0] - target : target - threshold.caution[1];
  return Math.round(gap * 100) / 100;
}

/** 카드에 붙이는 여유 폭 문구. 기준 안이면 초과 사실만 적는다 */
export function headroomText(indicator: LegalIndicator, value: number | null): string | null {
  const gap = headroomToCaution(indicator, value);
  if (gap === null) return null;
  const threshold = LEGAL_THRESHOLDS[indicator];
  const bound = threshold.direction === 'above' ? threshold.caution[0] : threshold.caution[1];
  if (gap <= 0) return `주의 기준 ${bound}% 초과`;
  return `주의 기준 ${bound}%까지 ${gap.toFixed(2)}%p`;
}

/** 값이 있는 법정 지표 중 가장 작은 여유 폭. 전부 자료가 없으면 null */
export function minHeadroom(summary: EntitySummary): number | null {
  const gaps = summary.crisis
    .map((signal) => headroomToCaution(signal.indicator, signal.value))
    .filter((gap): gap is number => gap !== null);
  return gaps.length === 0 ? null : Math.min(...gaps);
}

/**
 * 백분위 미니바의 10단계 폭 클래스. Tailwind가 소스에서 찾을 수 있도록 문자열을 그대로 적는다.
 * 「상위 N%」가 작을수록(= 동종단체 안에서 값이 클수록) 막대가 길다.
 */
export const BAR_WIDTH_CLASS: readonly string[] = [
  'w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]',
  'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full',
];

export function barWidthClass(percentile: number | null): string {
  if (percentile === null || !Number.isFinite(percentile)) return BAR_WIDTH_CLASS[0];
  const step = Math.round((100 - Math.min(Math.max(percentile, 0), 100)) / 10);
  return BAR_WIDTH_CLASS[Math.min(Math.max(step, 0), BAR_WIDTH_CLASS.length - 1)];
}

/** 화면 하단 고정 각주 — 값의 성격을 오해하지 않도록 매번 같은 문장을 쓴다 */
export const FOOTNOTE_DESIGNATION =
  '기준 충족은 지정이 아니다 — 지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량이다(시행령 제65조의3 "지정할 수 있다").';

export const FOOTNOTE_PERCENTILE =
  '백분위는 순위이지 평가가 아니다. 「상위 N%」는 같은 유형(광역/시/군/자치구) 안에서 값이 큰 순서를 뜻할 뿐, 지출의 옳고 그름을 뜻하지 않는다.';

export const FOOTNOTE_PEER_AVG =
  '동종단체 평균은 지방재정365 응답에 없어 유형(광역/시/군/자치구)별로 직접 계산한 값이다(같은 해·같은 유형에서 값이 있는 자치단체의 산술평균).';
