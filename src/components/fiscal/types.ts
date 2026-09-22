import type {
  MetroFiscalData,
  DistrictFiscalData,
  NationalDebtHistoryEntry,
  MetroDebtHistoryEntry,
  DistrictDebtHistoryEntry,
  PopulationGroup,
  MetroHouseholdDebt,
} from '@/lib/data/fiscal-health-data';

// Re-export for convenience
export type {
  MetroFiscalData,
  DistrictFiscalData,
  NationalDebtHistoryEntry,
  MetroDebtHistoryEntry,
  DistrictDebtHistoryEntry,
  PopulationGroup,
  MetroHouseholdDebt,
};

// ============================================================
// Types
// ============================================================

export type ViewMode = 'fiscalStatus' | 'ranking' | 'debtRatio' | 'debtIncrease' | 'healthScore' | 'compare' | 'peerBench';

export type SortKey = 'independence' | 'autonomy' | 'debtPerCapita';

// ============================================================
// Constants
// ============================================================

export const GLOSSARY: Record<string, string> = {
  '재정자립도':
    '(자체수입 / 자치단체 예산규모) x 100. 자체수입은 지역세수입과 세외수입의 합계. 높을수록 중앙정부 의존도가 낮음.',
  '재정자주도':
    '((자체수입 + 자주재원) / 자치단체 예산규모) x 100. 자주재원은 지역교부세, 재정보전금 등. 자립도보다 넓은 재원 자율성 지표.',
  '지역채무':
    '지역자치단체가 발행한 지역채와 차입금 등의 합계. 지역개발, 인프라 투자 등의 재원으로 사용. 출처: 지방재정365 결산(통합회계 채무잔액). 여기서 \'채무\'는 지방채·차입금 등 지방재정법상 채무(통합회계 잔액)이며, 미지급금·BTL 임대료·퇴직급여충당 등 \'부채\'는 포함하지 않는다. 부채는 별도 지표(자산대비 부채비율)로 본다. 자치구는 재원 대부분이 조정교부금·보조금이고 대형 인프라는 광역 사업이라 채무가 없는 경우가 많다(2024년 자치구 69곳 중 채무 있는 곳 10곳).',
  '1인당 지역채무':
    '지역채무 / 주민등록인구. 지역 주민 1인이 부담하는 지역정부 부채 규모.',
};

// ============================================================
// 지역채무 실시간 시계 상수
// ============================================================
export const DEBT_BASE_DATE = new Date('2025-01-01T00:00:00+09:00');
export const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

export const MODE_TABS: { key: ViewMode; label: string }[] = [
  { key: 'fiscalStatus', label: '재정현황' },
  { key: 'ranking', label: '시군구 순위' },
  { key: 'debtRatio', label: '채무비율 추이' },
  { key: 'debtIncrease', label: '채무 순증' },
  { key: 'healthScore', label: '건전성 점수' },
  { key: 'compare', label: '시군구 비교' },
  { key: 'peerBench', label: '규모별 비교' },
];

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'independence', label: '재정자립도 \u2193' },
  { key: 'autonomy', label: '재정자주도 \u2193' },
  { key: 'debtPerCapita', label: '1인당채무 \u2193' },
];

export const SELECT_CLASS =
  'bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1.5 text-base focus:outline-none focus:ring-1 focus:ring-blue-500';
