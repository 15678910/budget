/**
 * 기본값과 그 출처. 화면 입력칸의 배지와 출처 목록이 이 표 하나를 쓴다.
 * 확인 기록: docs/superpowers/notes/2026-11-12-basic-income-sources.md
 * kind: source = 1차 자료, derived = 필자 계산, assumption = 가정(정책 손잡이 포함).
 */
import { POPULATION_BY_YEAR } from '@/lib/constants';
import type { SourceKey, SourcedValue } from '../types';
import { BUDGET_2027_URL } from './budget-2027';

const NORWAY_RULE_URL = 'https://www.norskpetroleum.no/en/economy/management-of-revenues/';
const NBIM_2025_URL = 'https://www.nbim.no/en/news-and-insights/reports/2025/annual-report-2025/web-report-annual-report-2025/';
const FRANCE_DST_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038811588';
const GHG_2025_URL = 'https://mcee.go.kr/home/web/board/read.do?boardId=1892310&boardMasterId=939&menuId=10598';
const CARBON_LAW_URL = 'https://elaw.klri.re.kr/kor_service/lawViewTitle.do?hseq=59958';
const BIRTHS_URL = 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1011';
const POP_PROJ_URL = 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1009';
const INHERIT_TAX_URL = 'https://www.index.go.kr/unify/idx-info.do?idxCd=2848';
const TASIS_URL = 'https://tasis.nts.go.kr/';
const AD_SPEND_URL = 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156738893';
const SWISS_URL = 'https://www.bafu.admin.ch/de/co2-abgabe-private';
const CANADA_URL =
  'https://www.canada.ca/en/department-finance/news/2025/03/removing-the-consumer-carbon-price-effective-april-1-2025.html';
const RESIDENT_POP_URL = 'https://jumin.mois.go.kr/';

const a = (label: string, value: number, unit: string, note?: string, extra: Partial<SourcedValue> = {}): SourcedValue => ({
  label, value, unit, kind: 'assumption', note, ...extra,
});

export const DEFAULT_SOURCES: Record<SourceKey, SourcedValue> = {
  // 목표
  monthlyPerPerson: a('1인당 월 지급액', 100_000, '원', '첫 화면 예시 액수'),
  horizonYears: a('판정 기간', 50, '년', '지급 시작 해부터 센다'),
  population0: {
    label: '인구(기준)', value: POPULATION_BY_YEAR[2026], unit: '명', kind: 'source',
    source: '행정안전부 주민등록인구현황(2026년 2월)', url: RESIDENT_POP_URL,
  },
  // 장래인구추계 중위(2022년 5,167만 → 2072년 3,622만, 연 약 -0.7%)는 원문 대조 뒤에 넣는다.
  populationGrowth: a('인구 연평균 변화율', 0, '비율', '장래인구추계 원문 대조 전이라 0%로 둔 가정', { url: POP_PROJ_URL }),
  realReturn: a('기금 실질수익률', 0.043, '비율', '노르웨이 기금 1998~2025 실질 4.3%를 한국 기금에 그대로 둔 가정', {
    source: 'NBIM 2025 연차보고서', url: NBIM_2025_URL, columnRef: 13,
  }),
  withdrawalRate: {
    label: '인출률(해마다 꺼내는 상한)', value: 0.03, unit: '비율', kind: 'source',
    source: '노르웨이 재정 규칙(기대 실질수익 3%)', url: NORWAY_RULE_URL, columnRef: 10,
  },
  // 기금·나가는 돈
  initialFund: a('기본소득 기금 처음 잔액', 0, '조 원', 'S1 현행: 기본소득 기금 없음'),
  socialInsuranceTopUp: a('연금·건보 보전', 0, '조 원/년', '켜면 해마다 필요액에 더한다'),
  // 로봇세
  // 자동화 설비 규모 원문 자료를 찾으면 넣는다.
  robotBase: a('로봇세 과세 기반', 0, '조 원', '출처 확인 전'),
  robotRate: a('로봇세율', 0.05, '비율'),
  robotDecline: a('로봇세 기반 연 감소율', 0.03, '비율', '자동화가 끝나면 기반이 줄어든다'),
  // 데이터세
  dataBase: {
    label: '데이터세 과세 기반(온라인 광고비)', value: 10.1011, unit: '조 원', kind: 'source',
    source: "방송미디어통신위원회·한국방송광고진흥공사 '2025년 방송통신광고비 조사' 보도자료(2026.1.8)", url: AD_SPEND_URL,
    note: '2024년 온라인 광고비 10조 1,011억 원(명목, 전년 대비 7.9% 증가). 2025년 전망 10조 7,204억 원은 보도값이라 쓰지 않음',
  },
  dataRate: {
    label: '데이터세율', value: 0.03, unit: '비율', kind: 'source',
    source: '프랑스 디지털서비스세 3%(Loi n° 2019-759)', url: FRANCE_DST_URL, columnRef: 67,
    note: '프랑스 세율을 한국에 적용하는 것은 정책 선택',
  },
  dataGrowth: a('데이터세 기반 연 증가율', 0.05, '비율'),
  // 탄소세
  carbonEmissions: {
    label: '국가 온실가스 총배출량(2025 잠정)', value: 685.71, unit: '백만 t CO2eq', kind: 'source',
    source: '기후에너지환경부·온실가스종합정보센터 2025년도 잠정배출량(2026.9.20)', url: GHG_2025_URL,
    note: '확정치 아님(잠정)',
  },
  carbonTaxableShare: a('탄소세 과세 비율(총배출 중)', 0.26, '비율',
    'K-ETS 대상 배출에 겹쳐 매기지 않도록 그 밖 배출에만 매긴다고 둔 가정. K-ETS 관리 배출은 국가 배출의 약 74%(2024 배출권거래제 운영결과보고서, 보도값·원문 대조 전)'),
  carbonPrice: a('탄소세 t당 가격', 50_000, '원/t', '스위스 CO2 부담금 CHF 120/t(BAFU)보다 낮게 둔 가정', {
    url: SWISS_URL,
  }),
  netZeroYear: {
    label: '탄소중립 목표 연도', value: 2050, unit: '년', kind: 'source',
    source: '기후위기 대응을 위한 탄소중립·녹색성장 기본법', url: CARBON_LAW_URL,
    note: '목표 연도 조문 번호는 원문 대조 전',
  },
  // 유산 기부
  // 국세통계포털 6-2-2 상속세 결정 현황Ⅱ(2025년 결정, 백만 원): 전체 22,524명·총상속재산가액 48,241,988·총결정세액 8,934,470.
  // 50억 원 초과 구간(1,637명): 재산 6,417,155 + 7,890,128 + 5,756,932 = 20,064,215, 세액 1,524,956 + 2,634,822 + 2,221,334 = 6,381,112.
  bequestEstate: {
    label: '유산 기부 대상 상속재산(연)', value: 20.064215, unit: '조 원', kind: 'derived',
    source: '국세청 국세통계포털 6-2-2 상속세 결정 현황Ⅱ(2025년 결정분)', url: TASIS_URL,
    note: '총상속재산가액 50억 원 초과 구간 합계(1,637명, 명목). 50억 원 문턱은 필자 선택. 전체는 48.2조 원',
  },
  bequestUptake: a('유산 기부 선택률', 0.05, '비율', '상속인 중 기금 기부를 고르는 비율'),
  bequestShare: a('기부하는 유산 몫', 0.3, '비율', '칼럼의 유증 특례 30% 제안'),
  bequestTaxRate: {
    label: '상속세 실효율', value: 0.318, unit: '비율', kind: 'derived',
    source: '국세청 국세통계포털 6-2-2 상속세 결정 현황Ⅱ(2025년 결정분)', url: TASIS_URL,
    note: '50억 원 초과 구간 총결정세액 ÷ 총상속재산가액(6.38조 ÷ 20.06조). 전체 평균은 18.5%',
  },
  bequestSpecialRate: a('유산 특례 세율', 0.2, '비율', '칼럼 제안: 유산의 30%를 기금에 남기면 나머지에 20% 단일 세율'),
  // 초과 세수
  surplusExcess: a('해마다 기준선을 넘는 초과 세수', 0, '조 원/년', '출처 확인 전'),
  surplusSaveRatio: a('초과 세수 중 기금 적립 비율', 0.3, '비율'),
  sharedYield: a('공유 자산 배당률', 0.04, '비율', '공공 지분에서 해마다 나오는 배당'),
  // 미래대응기금
  futureFundTotal: {
    label: '미래대응기금 규모', value: 162.3, unit: '조 원', kind: 'source',
    source: '기획예산처 2027년 예산안', url: BUDGET_2027_URL,
  },
  futureFundSurplus: {
    label: '미래대응기금 여유 재원', value: 104.4, unit: '조 원', kind: 'derived',
    note: '162.3조에서 사업비 45.4조와 국채 발행 축소 12.5조를 뺀 값(필자 계산)',
  },
  depositRate: a('공자기금 예탁 이자율', 0.03, '비율'),
  consignReturn: a('위탁 운용 기대수익률', 0.05, '비율'),
  childBirths: {
    label: '2025년 출생아 수', value: 254_341, unit: '명', kind: 'source',
    source: '국가데이터처 출생(확정)통계, e-나라지표', url: BIRTHS_URL, columnRef: 20,
  },
  childTarget: a('아동 계좌 18세 목표액', 100_000_000, '원', '칼럼 제안 1억 원'),
  childRate: {
    label: '아동 계좌 명목수익률', value: 0.066, unit: '비율', kind: 'source',
    source: 'NBIM 2025 연차보고서(1998~2025 명목 6.6%)', url: NBIM_2025_URL, columnRef: 13,
  },
  childYears: a('아동 계좌 적립 기간', 18, '년'),
  // 참고 값(입력칸 없음)
  budgetTotal2027: {
    label: '2027년 예산안 총지출', value: 820.9, unit: '조 원', kind: 'source',
    source: '기획예산처 2027년 예산안 보도자료', url: BUDGET_2027_URL,
    note: '보도 표에서 옮김. 원문 PDF 대조 전',
  },
  inheritanceTaxPaid: {
    label: '상속세 총결정세액', value: 8.9345, unit: '조 원', kind: 'source',
    source: '국세청 국세통계, e-나라지표(갱신 2026-07-07)', url: INHERIT_TAX_URL,
    note: '표기 연도 2025년(귀속연도 여부 미구분)',
  },
  swissCo2Levy: {
    label: '스위스 CO2 부담금(주민 동일액 환급)', value: 120, unit: 'CHF/t', kind: 'source',
    source: 'BAFU CO2-Abgabe für Privatpersonen', url: SWISS_URL,
  },
  canadaCarbonRepeal: {
    label: '캐나다 소비자 탄소가격 폐지', value: 2025, unit: '년(4월 1일)', kind: 'source',
    source: 'Department of Finance Canada(2025.3.22)', url: CANADA_URL,
  },
};
