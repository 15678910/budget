/**
 * 시뮬레이터 첫 화면 값. 숫자는 data/sources.ts의 DEFAULT_SOURCES에서만 가져온다.
 * 첫 화면은 S1 현행(기본소득 기금 0원)이다.
 */
import { DEFAULT_SOURCES } from './data/sources';
import type { ExcludedRevenue, FutureFundInput, SharedAsset, SimInput, SourceKey } from './types';

export { DEFAULT_SOURCES } from './data/sources';

const v = (k: SourceKey): number => DEFAULT_SOURCES[k].value;

/** 공유 자산: 앞 셋은 이미 공공 지분을 만들 수 있는 곳, 뒤 셋은 검토 후보 산업. 지분은 0에서 시작한다. */
export const SHARED_ASSET_CANDIDATES: SharedAsset[] = [
  { id: 'renewable', label: '재생에너지 발전', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: false },
  { id: 'chip-ai-equity', label: '반도체·AI 지원금 지분 전환', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: false },
  { id: 'fixed-savings', label: '확정된 지출 절감액', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: false },
  { id: 'offshore-wind', label: '해상풍력(검토 후보)', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: true },
  { id: 'ai-compute', label: '국가 AI 연산 자원(검토 후보)', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: true },
  { id: 'public-data', label: '공공 데이터(검토 후보)', stake: 0, yieldRate: v('sharedYield'), mode: 'save', candidate: true },
];

export const DEFAULT_INPUT: SimInput = {
  baseYear: 2027,
  payStartYear: 2027,
  horizonYears: v('horizonYears'),
  monthlyPerPerson: v('monthlyPerPerson'),
  population0: v('population0'),
  populationGrowth: v('populationGrowth'),
  realReturn: v('realReturn'),
  withdrawalRate: v('withdrawalRate'),
  initialFund: v('initialFund'),
  socialInsuranceTopUp: { enabled: false, annual: v('socialInsuranceTopUp') },
  alt: {
    robot: { base: v('robotBase'), rate: v('robotRate'), annualDecline: v('robotDecline'), mode: 'save' },
    data: { base: v('dataBase'), rate: v('dataRate'), annualGrowth: v('dataGrowth'), mode: 'pay' },
    carbon: { emissionsMt: v('carbonEmissions'), pricePerTonWon: v('carbonPrice'), netZeroYear: v('netZeroYear'), taxableShare: v('carbonTaxableShare'), mode: 'save' },
  },
  bequest: {
    eligibleEstate: v('bequestEstate'),
    uptake: v('bequestUptake'),
    shareToFund: v('bequestShare'),
    effectiveTaxRate: v('bequestTaxRate'),
    specialRate: v('bequestSpecialRate'),
  },
  surplus: { annualExcess: v('surplusExcess'), saveRatio: v('surplusSaveRatio') },
  sharedAssets: SHARED_ASSET_CANDIDATES,
};

export const DEFAULT_FUTURE_FUND: FutureFundInput = {
  totalFund: v('futureFundTotal'),
  surplusFund: v('futureFundSurplus'),
  depositRate: v('depositRate'),
  consignReturn: v('consignReturn'),
  child: { births: v('childBirths'), targetWon: v('childTarget'), rate: v('childRate'), years: v('childYears') },
};

/** 기본소득 재원에서 뺀 세입. 이미 법이 정한 쓰임이 있다. */
export const EXCLUDED_REVENUES: ExcludedRevenue[] = [
  {
    label: 'K-ETS 배출권 유상할당 수입',
    reason: '기후대응기금으로 가므로 제외',
    source: '탄소중립기본법 제69조(기후대응기금의 설치). 재원 조항 본문은 원문 대조 전',
    url: 'https://elaw.klri.re.kr/kor_service/lawViewTitle.do?hseq=59958',
  },
];
