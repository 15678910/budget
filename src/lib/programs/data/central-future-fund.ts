/**
 * 1단계 데이터 — 미래대응기금 4대 계정 주요사업 (설계문서 §2).
 *
 * 원칙
 * - 금액은 홍보자료 7쪽 「미래대응기금 주요사업」 표를 기준으로 한다. 본문·100대 신규사업·
 *   청년정책 개요도가 다른 숫자를 주면 계정 표를 따르고 차이를 행 위 주석에 적는다
 *   (설계 §2: "홍보자료가 조 단위 한 자리만 준 항목은 그대로 둔다").
 * - spendType·nature·route는 원자료 문장을 그대로 인용한 evidence 없이 쓰지 않는다.
 *   인용문은 PDF 추출 텍스트의 줄바꿈만 공백으로 이어 붙였고 글자는 고치지 않았다.
 * - 계정 「기타」 잔여 행은 정부가 주요사업으로 공개하지 않은 나머지다. 분류 없음, 총액에는 포함.
 */
import type { Program, ProgramEvidence } from '../types';
import { CENTRAL_GOV } from '../gov';

const SRC_PROMO = '기획예산처 2027년 예산안 홍보자료 7쪽 「미래대응기금 주요사업」';
const SRC_YOUTH = '기획예산처 2027년 청년정책 주요내용 개요도';

/** 홍보자료 본문 쪽 */
const promo = (page: number): string => `기획예산처 2027년 예산안 홍보자료 ${page}쪽`;
/** 100대 신규사업의 사업별 항목 */
const p100 = (name: string): string => `기획예산처 100대 신규사업 「${name}」`;

/**
 * 홍보자료 7쪽 표의 계정 줄. 모든 1단계 행의 route: 'fund' 근거다
 * (이 표에 실렸다는 것이 곧 미래대응기금 사업지출이라는 뜻).
 */
const ROUTE_LINE = {
  youthJob: '①(일자리·창업) 노동부청년첫취업지원(신규0.4조원), 중기부창업사업화(1.0조원)',
  youthHousing: '②(주거안정) 국토부보편형 공공임대주택(신규1.4조원)',
  youthAsset: '③(자산형성) 금융위청년미래적금(1.7조원), 금융위청년기회자금(신규0.1조원)',
  youthFamily: '④(혼인·출산) 복지부,성평등부혼인·출산·양육 3종 패키지(2.9→3.8조원)',
  youthCulture: '⑤(생활·문화) 문체부청년문화예술패스(361억원→0.8조원)',
  growthAiModel: '①(AI) 과기부프론티어급 AI 개발(신규4.7조원) 과기부모두의 AI(신규0.25조원)',
  growthAiRnd: '산업부제조암묵지R&D(신규0.3조원), 과기부·산업부AIDC 생태계(신규0.3조원)',
  growthTech: '②(전략기술) 국토부자율주행실증도시(0.1→0.8조원), 우주청차세대 발사체(0.1→0.3조원)',
  growthEquity: '③(지분투자) 재경부공급망안정화(0.2조원), 금융위PF사업장 정상화 펀드(신규0.5조원)',
  growthPower: '④(전력·용수) 기후부한전출자(신규0.5조원), 기후부서남권 반도체산단 용수(신규0.1조원)',
  regionalGeneral:
    '①(일반재원) 행안부지방미래성장지원금(신규3.5조원), 행안부국민생활편의 복합센터(신규1.5조원)',
  regionalRural: '②(농어촌) 농식품부농업 AX실증(신규0.02조원), 농·수산물 유통개선(신규0.01조원)',
  regionalMerge: '③(행정통합) 행안부전남·광주 통합지원금(일반2.85조원, 사무이관0.65조원)',
  regionalEtc: '④(기타) 문체부지방 호텔 건립 지원(신규0.15조원)',
  eduTop:
    '①(초격차 인재) 과기부4대 과기원(0.7→0.8조원), 과기부이공계 장학금(0.1→0.2조원), 중기부창업중심대학(신규0.1조원), 과기부AI중심대학(0.1→0.2조원)',
  eduHigher:
    '②(고등･영유아) 교육부미래인재성장자금(신규0.7조원), 교육부교사·아동비율 개선(0.3→0.5조원) 교육부지방국립대 전액장학금(신규0.2조원), 교육부인턴학기제(신규0.5조원)',
} as const;

const fund = (line: string): ProgramEvidence => ({ field: 'route', quote: line, source: SRC_PROMO });

export const CENTRAL_FUTURE_FUND_PROGRAMS: readonly Program[] = [
  // ───────── 청년계정 13.3조원 ─────────
  // 100대 신규사업은 "국민취업지원제도에서 … 분리·신설"이라고 적는다. 기존 제도에서 떼어낸
  // 사업이지만 ’26년 대응 금액을 주는 문장이 없고 홍보자료·개요도 모두 「신규」로 적어 new로 둔다.
  // 지출 유형은 구직촉진수당 현금 지급이 사업의 중심이므로 cash(설계 §3).
  // 단가×수량(12만명×65만원×6개월=4,680억원)은 1유형만의 값이라 unit으로 넣지 않았다.
  {
    id: 'youth-first-job',
    name: '청년첫취업지원제도',
    gov: CENTRAL_GOV,
    ministry: '노동부',
    area: 'youth',
    account: 'youth',
    amount26Eok: null,
    amount27Eok: 3793,
    nature: 'new',
    spendType: 'cash',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '(1유형) 소득·재산 기준을 충족하는 청년 12만명에게 구직촉진수당 65만원 × 6개월 지급',
        source: p100('청년 첫 취업 지원제도'),
      },
      {
        field: 'nature',
        quote:
          '국민취업지원제도에서 청년 취업 경험 요건을 완전히 폐지한 사업을 분리·신설하여 “첫 취업 청년” 특화 맞춤형 지원',
        source: p100('청년 첫 취업 지원제도'),
      },
      fund(ROUTE_LINE.youthJob),
      {
        field: 'amount27Eok',
        quote: '청년첫취업지원제도 신규 (’26) – →(’27) 3,793억원',
        source: SRC_YOUTH,
      },
    ],
    sources: [SRC_PROMO, SRC_YOUTH, p100('청년 첫 취업 지원제도')],
  },
  // 기금 몫 1.4조원과 사업 총액이 다르다. 100대 신규사업의 ’27년 지원내용은 62,159억원(3.6만호
  // 전체), 청년정책 개요도의 「청년보편형임대주택」은 38,300억원이다. 계정 표의 1.4조원을 썼다.
  {
    id: 'youth-universal-rental',
    name: '보편형 공공임대주택 (기금 몫)',
    gov: CENTRAL_GOV,
    ministry: '국토부',
    area: 'youth',
    account: 'youth',
    amount26Eok: null,
    amount27Eok: 14000,
    nature: 'new',
    spendType: 'infra',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '(건설형) 중형평형(50~84㎡) 임대주택 ’27년 총 2.6만호 공급(착공기준)',
        source: p100('보편형 공공임대주택 공급'),
      },
      { field: 'nature', quote: ROUTE_LINE.youthHousing, source: SRC_PROMO },
      fund(ROUTE_LINE.youthHousing),
      {
        field: 'amount27Eok',
        quote: '청년보편형임대주택 신규 (’26) – →(’27) 38,300억원',
        source: SRC_YOUTH,
      },
    ],
    sources: [SRC_PROMO, SRC_YOUTH, p100('보편형 공공임대주택 공급')],
  },
  {
    id: 'youth-future-savings',
    name: '청년미래적금',
    gov: CENTRAL_GOV,
    ministry: '금융위',
    area: 'youth',
    account: 'youth',
    amount26Eok: 7446,
    amount27Eok: 17011,
    nature: 'expanded',
    spendType: 'matched-saving',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '정부 기여금 혜택 확대 : 우대형 12→15%, 지방 중소기업 재직청년 12→25%',
        source: promo(27),
      },
      {
        field: 'nature',
        quote:
          '사회에 진출한 청년의 안정적인 목돈 마련과 자산시장 참여를 지원하기 위해 청년미래적금 확대·개편(0.7→1.7조원)',
        source: promo(27),
      },
      fund(ROUTE_LINE.youthAsset),
      { field: 'amount27Eok', quote: '청년미래적금 (’26) 7,446 →(’27) 17,011억원', source: SRC_YOUTH },
    ],
    sources: [SRC_PROMO, SRC_YOUTH, promo(27)],
  },
  // 1,027억원은 청년에게 직접 주는 돈이 아니라 서민금융진흥원의 대출 보증재원·이차보전 재원이다.
  // 설계 §3의 "기관·지자체·기업에 보조·출연 = grant"를 적용했다(계획은 판단 보류였다).
  {
    id: 'youth-opportunity-fund',
    name: '청년기회자금',
    gov: CENTRAL_GOV,
    ministry: '금융위',
    area: 'youth',
    account: 'youth',
    amount26Eok: null,
    amount27Eok: 1027,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    beneficiaries: { value: 80000, unit: '명', source: p100('미취업 청년 기회자금') },
    evidence: [
      {
        field: 'spendType',
        quote:
          '연간 약 8만명 대상으로 총 4,500억원 공급, 보증재원 및 이차보전·이자면제 재원으로 총 1,027억원 소요',
        source: p100('미취업 청년 기회자금'),
      },
      { field: 'nature', quote: ROUTE_LINE.youthAsset, source: SRC_PROMO },
      fund(ROUTE_LINE.youthAsset),
      {
        field: 'beneficiaries',
        quote:
          '연간 약 8만명 대상으로 총 4,500억원 공급, 보증재원 및 이차보전·이자면제 재원으로 총 1,027억원 소요',
        source: p100('미취업 청년 기회자금'),
      },
      {
        field: 'amount27Eok',
        quote: '- 청년기회자금 - 1,027 · 대출후 취·창업전까지 이자면제',
        source: promo(27),
      },
    ],
    sources: [SRC_PROMO, promo(27), p100('미취업 청년 기회자금')],
  },
  // 계획의 잠정값은 amount26Eok: null이었으나 nature가 tax-converted면 ’26년 재정 지출 칸이 숫자여야
  // 한다. 홍보자료 29쪽 표가 "- 혼인지원금 - 1,663"으로 ’26년을 「-」로 적으므로 0을 넣었다
  // (’26년에는 혼인세액공제였고 재정 지출은 없었다).
  // 단가×수량은 문서에 명시돼 있으나 예산과 맞지 않는다 — unit.note 참조.
  {
    id: 'youth-marriage-grant',
    name: '혼인지원금',
    gov: CENTRAL_GOV,
    ministry: '성평등부',
    area: 'youth',
    account: 'youth',
    amount26Eok: 0,
    amount27Eok: 1663,
    nature: 'tax-converted',
    spendType: 'cash',
    route: 'fund',
    unit: {
      price: '부부당 100만원',
      count: '48만명',
      product: 4800,
      matches: false,
      note: '단가×수량 4,800억원은 ’27년 예산 1,663억원과 맞지 않는다. 100대 신규사업은 지원조건을 「지자체 경상보조 (서울35%, 지방65% ±10%)」로 적어 국비가 총소요의 일부임을 밝히지만, 차액 자체를 설명한 문장은 없다.',
    },
    beneficiaries: { value: 480000, unit: '명', source: p100('혼인지원금 지급') },
    evidence: [
      {
        field: 'spendType',
        quote: '혼인신고 시 부부당 100만원 현금 지급(생애 1회)',
        source: p100('혼인지원금 지급'),
      },
      {
        field: 'nature',
        quote:
          '➊ (혼인) 저소득층이 혜택을 받지 못하고 있는 혼인세액공제를 신규혼인지원금으로 전환, 혼인신고 부부에게 100만원 지원(생애 1회)',
        source: promo(29),
      },
      fund(ROUTE_LINE.youthFamily),
      {
        field: 'unit',
        quote:
          '기존 혼인세액공제*를 재정전환하여, 혼인신고를 완료한 부부에게 100만원 현금 지급(생애 1회, 48만명)',
        source: p100('혼인지원금 지급'),
      },
      { field: 'amount27Eok', quote: '- 혼인지원금 - 1,663 · ‘27.하반기 시행', source: promo(29) },
    ],
    sources: [SRC_PROMO, promo(29), p100('혼인지원금 지급')],
  },
  // 100대 신규사업은 ’26년 첫만남이용권을 4,112억원으로, 홍보자료 29쪽 표와 청년정책 개요도는
  // 4,111억원으로 적는다. 계정 표와 같은 문서(홍보자료)의 4,111을 썼다.
  {
    id: 'youth-newborn-grant',
    name: '아이맞이지원금',
    gov: CENTRAL_GOV,
    ministry: '복지부',
    area: 'youth',
    account: 'youth',
    amount26Eok: 4111,
    amount27Eok: 6981,
    nature: 'tax-converted',
    spendType: 'cash',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '(사업내용) 출생아동에게 1,000~2000만원 아이맞이 (출산)지원금을 지급하여 출산초기 경제적 부담 경감',
        source: p100('아이맞이 (출산)지원금 지급'),
      },
      {
        field: 'nature',
        quote:
          '➋ (출산) 출산·입양세액공제를 재정전환하고 첫만남이용권·부모급여와 통합하여 신규아이맞이(출산)지원금 신설(1~2천만원, 1년간 4회 분할지급)',
        source: promo(29),
      },
      fund(ROUTE_LINE.youthFamily),
      {
        field: 'amount27Eok',
        quote: '- 아이맞이(출산)지원금 4,111 6,981 · ‘27.7월 시행',
        source: promo(29),
      },
    ],
    sources: [SRC_PROMO, promo(29), p100('아이맞이 (출산)지원금 지급')],
  },
  // 홍보자료 29쪽 본문은 "기존아동수당 대비 2~3배로 확대·개편"이라고 적어 확대로 읽을 수도 있다.
  // 그러나 같은 쪽 표가 ’26년 아동수당 24,822억원을 그대로 ’27년 29,272억원으로 이어 적고, 이
  // 금액이 미래대응기금 청년계정 3종 패키지 안에 들어가 있다. 새로 만든 돈이 아니라 기존 급여의
  // 재원이 기금으로 옮겨 실린 것이므로 transferred(설계 §3)로 둔다.
  {
    id: 'youth-child-allowance',
    name: '아동기본수당',
    gov: CENTRAL_GOV,
    ministry: '복지부',
    area: 'youth',
    account: 'youth',
    amount26Eok: 24822,
    amount27Eok: 29272,
    nature: 'transferred',
    spendType: 'cash',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '기존 아동수당 대비 2~3배의 아동기본수당을 도입하고, 0~1세는 가정양육시 月 30만원 추가 지급 (’27.7~)',
        source: promo(48),
      },
      {
        field: 'nature',
        quote: '- 아동수당(아동기본수당 포함) 24,822 29,272 · 아동기본수당 ‘27.7월 시행',
        source: promo(29),
      },
      {
        field: 'nature',
        quote: '조세지출·복지급여를 통합·확대하여 3종 패키지 지원 * 혼인지원금, 아이맞이(출산)지원금, 아동기본수당 지원',
        source: promo(13),
      },
      fund(ROUTE_LINE.youthFamily),
      { field: 'amount27Eok', quote: '아동기본수당 (’26) 24,822 →(’27) 29,272억원', source: SRC_YOUTH },
    ],
    sources: [SRC_PROMO, promo(29), promo(13), SRC_YOUTH],
  },
  // 바우처는 설계 §3에서 cash로 분류한다. 단가가 10만원/15만원(지방우대)으로 갈려 unit은 넣지 않고
  // 수혜 인원만 적었다.
  {
    id: 'youth-culture-pass',
    name: '청년문화예술패스',
    gov: CENTRAL_GOV,
    ministry: '문체부',
    area: 'youth',
    account: 'youth',
    amount26Eok: 361,
    amount27Eok: 7925,
    nature: 'expanded',
    spendType: 'cash',
    route: 'fund',
    beneficiaries: { value: 9190000, unit: '명', source: promo(30) },
    evidence: [
      {
        field: 'spendType',
        quote: '* (기존) 19~20세 28만명, 생애 1회 → (개편) 19~34세 919만명, 매년 (10/15만원)',
        source: promo(30),
      },
      {
        field: 'nature',
        quote:
          '청년문화예술패스 지원 대상을 모든 청년으로 대폭 확대하고 활용처를 공연·전시·영화·도서에서 체육까지 포함(7,925억원)',
        source: promo(30),
      },
      fund(ROUTE_LINE.youthCulture),
      {
        field: 'beneficiaries',
        quote: '* (기존) 19~20세 28만명, 생애 1회 → (개편) 19~34세 919만명, 매년 (10/15만원)',
        source: promo(30),
      },
      { field: 'amount27Eok', quote: ROUTE_LINE.youthCulture, source: SRC_PROMO },
    ],
    sources: [SRC_PROMO, promo(30), SRC_YOUTH],
  },
  // 「중기부 창업사업화(1.0조원)」는 홍보자료 7쪽에 실려 있으나 이 사업의 ’26년 금액을 주는 문장이
  // 어느 문서에도 없다. 계정 표는 신규 표기 없이 1.0조원만 적어 기존 사업으로 보이는데(같은 표에서
  // 신규 사업에는 모두 「신규」가 붙는다), nature를 expanded로 두려면 ’26년 숫자가 있어야 한다.
  // 숫자를 지어내지 않으려고 별도 행으로 세우지 않고 잔여에 포함했다. 출처가 확인되면 행으로 뺀다.
  {
    id: 'youth-remainder',
    name: '(기타) 청년계정 잔여 — 중기부 창업사업화 1.0조원 포함',
    gov: CENTRAL_GOV,
    ministry: '—',
    area: 'other',
    account: 'youth',
    amount26Eok: null,
    amount27Eok: 51328,
    nature: 'unknown',
    spendType: 'unknown',
    route: 'fund',
    evidence: [],
    sources: [SRC_PROMO],
    isRemainder: true,
  },

  // ───────── 성장동력계정 14.2조원 ─────────
  // 계획의 잠정값은 rnd였으나 홍보자료가 지원 방식을 「출자」로 못 박는다(10쪽·17쪽). 설계 §3의
  // "지분 취득·펀드 출자 = equity"를 따랐다. 자본축적성 렌즈 값은 rnd와 같은 1이다.
  {
    id: 'growth-frontier-ai',
    name: '프론티어급 AI 개발',
    gov: CENTRAL_GOV,
    ministry: '과기부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 47000,
    nature: 'new',
    spendType: 'equity',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '공모·평가를 통해 핵심 기업을 선정하여 대규모 재정을 투입하되, 그 성과가 국민에게 환류되도록 출자 방식으로 사업구조 설계',
        source: promo(17),
      },
      {
        field: 'spendType',
        quote: '(프론티어급 AI 모델) GPU 1만장 지원하는 대규모 사업(4.7조원) → 정부 출자로 이익 공유',
        source: promo(10),
      },
      { field: 'nature', quote: ROUTE_LINE.growthAiModel, source: SRC_PROMO },
      fund(ROUTE_LINE.growthAiModel),
    ],
    sources: [SRC_PROMO, promo(10), promo(17)],
  },
  {
    id: 'growth-ai-for-all',
    name: '모두의 AI',
    gov: CENTRAL_GOV,
    ministry: '과기부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 2500,
    nature: 'new',
    spendType: 'service',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '(신규모두의 AI) 독자 AI 모델을 기반으로 국민 누구나 쉽고 부담없이 활용할 수 있는 대국민 AI 서비스 개발·제공(0.25조원)',
        source: promo(17),
      },
      { field: 'nature', quote: ROUTE_LINE.growthAiModel, source: SRC_PROMO },
      fund(ROUTE_LINE.growthAiModel),
    ],
    sources: [SRC_PROMO, promo(17)],
  },
  // 100대 신규사업의 ’27년 지원내용은 2,900억원. 계정 표의 0.3조원을 썼다.
  {
    id: 'growth-tacit-ai',
    name: '제조암묵지 R&D',
    gov: CENTRAL_GOV,
    ministry: '산업부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 3000,
    nature: 'new',
    spendType: 'rnd',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '□ (지원내용) 암묵지 DB화 및 암묵지 기반의 AI 솔루션(로봇·제조AI 등) 개발·확산, 이를 촉진하기 위한 기반을 구축',
        source: p100('제조암묵지활용AI솔루션개발(R&D)'),
      },
      { field: 'nature', quote: ROUTE_LINE.growthAiRnd, source: SRC_PROMO },
      fund(ROUTE_LINE.growthAiRnd),
      {
        field: 'amount27Eok',
        quote: '2. ’27년 지원내용 : 2,900억원',
        source: p100('제조암묵지활용AI솔루션개발(R&D)'),
      },
    ],
    sources: [SRC_PROMO, p100('제조암묵지활용AI솔루션개발(R&D)')],
  },
  // 100대 신규사업은 1,155억원, 홍보자료 15쪽 본문은 1,545억원으로 적는다. 계정 표의 0.3조원을 썼다.
  {
    id: 'growth-aidc',
    name: 'AIDC 생태계',
    gov: CENTRAL_GOV,
    ministry: '과기부·산업부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 3000,
    nature: 'new',
    spendType: 'rnd',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '□ (사업내용) 국내 AIDC 기반의 AIDC 산업생태계를 조성하기 위해 서버·냉각·전력 등 소재·부품·장비, 클라우드 등 핵심기술 내재화',
        source: p100('AIDC 소부장·클라우드 기술개발·고도화(R&D)'),
      },
      { field: 'nature', quote: ROUTE_LINE.growthAiRnd, source: SRC_PROMO },
      fund(ROUTE_LINE.growthAiRnd),
      {
        field: 'amount27Eok',
        quote: '2. ’27년 지원내용: 1,155억원',
        source: p100('AIDC 소부장·클라우드 기술개발·고도화(R&D)'),
      },
    ],
    sources: [SRC_PROMO, p100('AIDC 소부장·클라우드 기술개발·고도화(R&D)')],
  },
  // 지출 대상이 실증차량·실증도시 조성(설비·시설)이므로 infra. 사업명에 (R&D) 표기가 없다.
  // 홍보자료 62쪽 본문은 618→8,395억원, 63쪽 표는 618→8,415억원으로 적는다.
  // 계정 표의 0.1→0.8조원을 썼다.
  {
    id: 'growth-autonomous-city',
    name: '자율주행 실증도시',
    gov: CENTRAL_GOV,
    ministry: '국토부',
    area: 'growth-engine',
    account: 'growth',
    amount26Eok: 1000,
    amount27Eok: 8000,
    nature: 'expanded',
    spendType: 'infra',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '완전 자율주행 조기 상용화를 위해 실증차량을 대폭 확대(200→3,000대)*하고 대규모 주행데이터 축적 추진',
        source: promo(62),
      },
      { field: 'nature', quote: ROUTE_LINE.growthTech, source: SRC_PROMO },
      fund(ROUTE_LINE.growthTech),
      {
        field: 'amount27Eok',
        quote: '* (자율주행 실증도시 조성) 618 → 8,395억원, 1→3~5개 도시 확대',
        source: promo(62),
      },
    ],
    sources: [SRC_PROMO, promo(62)],
  },
  // 홍보자료 58쪽 각주는 차세대발사체개발을 2,916억원으로 적는다. 계정 표의 0.1→0.3조원을 썼다.
  {
    id: 'growth-launcher',
    name: '차세대 발사체',
    gov: CENTRAL_GOV,
    ministry: '우주청',
    area: 'growth-engine',
    account: 'growth',
    amount26Eok: 1000,
    amount27Eok: 3000,
    nature: 'expanded',
    spendType: 'rnd',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: '’30년 달 착륙을 위한 착륙·발사체 R&D 지원', source: promo(13) },
      { field: 'nature', quote: ROUTE_LINE.growthTech, source: SRC_PROMO },
      fund(ROUTE_LINE.growthTech),
      {
        field: 'amount27Eok',
        quote:
          '* 차세대발사체개발(2,916억원), 한국형발사체고도화(1,550억원), 바이오·의료기술개발(5,113억원), 핵융합핵심기술개발및인프라(1,601억원) 등',
        source: promo(58),
      },
    ],
    sources: [SRC_PROMO, promo(13), promo(58)],
  },
  // 계획이 (확인)으로 남긴 두 칸: ’26년 100억원(홍보자료 45쪽 "0.01→0.2조원"), nature는 expanded
  // (100대 신규사업도 사업기간을 "‘26년 ~ 계속"으로 적는다).
  {
    id: 'growth-supply-chain',
    name: '공급망안정화',
    gov: CENTRAL_GOV,
    ministry: '재경부',
    area: 'growth-engine',
    account: 'growth',
    amount26Eok: 100,
    amount27Eok: 2000,
    nature: 'expanded',
    spendType: 'equity',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '□ (지원내용) 현지 기업 지분투자, 해외 신규 법인설립(단독·합작) 등 해외투자 재원 마련을 위해 수은(공급망안정화기금)에 특별재원 출자',
        source: p100('해외공급망 투자 강화'),
      },
      { field: 'nature', quote: '【현지투자】“해외 공급망 투자 강화” 0.01→0.2조원', source: promo(45) },
      { field: 'nature', quote: '□ (사업기간) ‘26년 ~ 계속', source: p100('해외공급망 투자 강화') },
      fund(ROUTE_LINE.growthEquity),
      {
        field: 'amount27Eok',
        quote:
          '(현지투자) 공급망 위기에 대비한 현지 지분확보, 해외 신규법인 설립(단독·합작) 등 신규해외 공급망 투자 강화(0.2조원)',
        source: promo(45),
      },
    ],
    sources: [SRC_PROMO, promo(45), p100('해외공급망 투자 강화')],
  },
  {
    id: 'growth-pf-fund',
    name: 'PF사업장 정상화 펀드',
    gov: CENTRAL_GOV,
    ministry: '금융위',
    area: 'growth-engine',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 5000,
    nature: 'new',
    spendType: 'equity',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '√일시적 유동성 애로 사업장 대상 민관합동 펀드 조성 ⇒재정 0.5조원 출자 등 총 3조원 조성(‘27~29년)',
        source: promo(39),
      },
      { field: 'nature', quote: ROUTE_LINE.growthEquity, source: SRC_PROMO },
      fund(ROUTE_LINE.growthEquity),
    ],
    sources: [SRC_PROMO, promo(39)],
  },
  {
    id: 'growth-kepco-equity',
    name: '한전 출자',
    gov: CENTRAL_GOV,
    ministry: '기후부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 5000,
    nature: 'new',
    spendType: 'equity',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '(투자여력) 전력망 투자재원 보강을 위해 신규한국전력공사 출자(5,000억원) 및 신규취약계층 전기요금 복지할인 지원(3,500억원)',
        source: promo(16),
      },
      { field: 'nature', quote: ROUTE_LINE.growthPower, source: SRC_PROMO },
      fund(ROUTE_LINE.growthPower),
      {
        field: 'amount27Eok',
        quote: '* 한국전력 자본금: (기존) 3.2조원 → (변경) 3.7조원(+0.5조원)',
        source: promo(16),
      },
    ],
    sources: [SRC_PROMO, promo(16)],
  },
  // 홍보자료 16쪽 표의 서남권 반도체산단 용수공급은 1,196억원. 계정 표의 0.1조원을 썼다.
  {
    id: 'growth-semicon-water',
    name: '서남권 반도체산단 용수',
    gov: CENTRAL_GOV,
    ministry: '기후부',
    area: 'mega-ai',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 1000,
    nature: 'new',
    spendType: 'infra',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '(용수공급) 반도체 등 첨단산업 생산시설·협력업체의 공업용수 수요 급증에 대응하기 위한 신규용수공급·수자원시설 확충(1,277억원)',
        source: promo(16),
      },
      { field: 'nature', quote: ROUTE_LINE.growthPower, source: SRC_PROMO },
      fund(ROUTE_LINE.growthPower),
      {
        field: 'amount27Eok',
        quote: '-서남권 반도체산단 용수공급 1,196 1.3조원· 133만톤/일 산단 공급 (~‘32)',
        source: promo(16),
      },
    ],
    sources: [SRC_PROMO, promo(16)],
  },
  {
    id: 'growth-remainder',
    name: '(기타) 성장동력계정 잔여',
    gov: CENTRAL_GOV,
    ministry: '—',
    area: 'other',
    account: 'growth',
    amount26Eok: null,
    amount27Eok: 62500,
    nature: 'unknown',
    spendType: 'unknown',
    route: 'fund',
    evidence: [],
    sources: [SRC_PROMO],
    isRemainder: true,
  },

  // ───────── 지방계정 사업지출 10.3조원 (여유자금 5조원 제외) ─────────
  {
    id: 'regional-growth-grant',
    name: '지방미래성장지원금',
    gov: CENTRAL_GOV,
    ministry: '행안부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 35000,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '지역의 성장거점 조성 및 정주여건 개선 등을 위해 미래대응기금을 통해 신규지방미래성장지원금 지원(3.5조원)',
        source: promo(32),
      },
      { field: 'nature', quote: ROUTE_LINE.regionalGeneral, source: SRC_PROMO },
      fund(ROUTE_LINE.regionalGeneral),
    ],
    sources: [SRC_PROMO, promo(32)],
  },
  // 지자체에 주는 정액 국비 보조이지만 지출 대상이 건물 신축·리모델링이므로 infra로 두었다
  // (설계 §3 "건설·설비·주택 매입 = infra"). 보조 방식이라는 점은 두 번째 인용문에 남긴다.
  // 홍보자료 33쪽 표는 15,005억원, 100대 신규사업은 15,000억원. 계정 표의 1.5조원을 썼다.
  {
    id: 'regional-living-center',
    name: '국민생활편의 복합센터',
    gov: CENTRAL_GOV,
    ministry: '행안부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 15000,
    nature: 'new',
    spendType: 'infra',
    route: 'fund',
    unit: {
      price: '신축형 200억원/개소, 리모델링형 100억원/개소',
      count: '신축 60개소 + 리모델링 30개소',
      product: 15000,
      matches: true,
      note: '100대 신규사업의 내역(12,000 + 3,000억원)이 ’27년 소요와 정확히 맞는다. 홍보자료 33쪽 표는 15,005억원으로 5억원 차이가 있다.',
    },
    evidence: [
      {
        field: 'spendType',
        quote:
          '(주민생활) 신규지역이 원하는 복지·문화 등 다양한 기능*을 하나로 복합·집적화한 ‘국민생활편의 복합센터’ 건립 지원**(90개, 1.5조원)',
        source: promo(33),
      },
      {
        field: 'spendType',
        quote: 'ㅇ 총 180개소, 개소당 최대 200신축형/100억원리모델링형 국비 정액 지원',
        source: p100('국민생활편의 복합센터'),
      },
      { field: 'nature', quote: ROUTE_LINE.regionalGeneral, source: SRC_PROMO },
      fund(ROUTE_LINE.regionalGeneral),
      { field: 'unit', quote: '신축형 12,000억원(=60개×200억원)', source: p100('국민생활편의 복합센터') },
      { field: 'unit', quote: '리모델링형 3,000억원(=30개×100억원)', source: p100('국민생활편의 복합센터') },
    ],
    sources: [SRC_PROMO, promo(33), p100('국민생활편의 복합센터')],
  },
  // 208억원 중 가장 큰 세부사업은 농업용로봇 보급 지원 98억원(컨소시엄·공동영농법인 대상)이다.
  // 설계 §3의 "둘 이상이면 금액이 큰 쪽" 규칙에 따라 grant. 금액은 계정 표의 0.02조원을 썼다.
  {
    id: 'regional-agri-ax',
    name: '농업 AX 실증',
    gov: CENTRAL_GOV,
    ministry: '농식품부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 200,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: 'ㅇ 컨소시엄(5개소, 농기계회사+농가) 또는 공동영농법인(30개소) 등 대상으로 농업용로봇 보급 지원',
        source: p100('농업 피지컬AX 실증 프로젝트'),
      },
      { field: 'nature', quote: ROUTE_LINE.regionalRural, source: SRC_PROMO },
      fund(ROUTE_LINE.regionalRural),
      {
        field: 'amount27Eok',
        quote: '2. ’27년 지원내용: 208억원',
        source: p100('농업 피지컬AX 실증 프로젝트'),
      },
    ],
    sources: [SRC_PROMO, p100('농업 피지컬AX 실증 프로젝트')],
  },
  // 계정 표의 「농·수산물 유통개선(신규0.01조원)」을 100대 신규사업의 「공공 스마트 물류(유통)센터
  // 구축」(110억원, 농수산물 유통)과 같은 사업으로 보았다. 금액은 계정 표의 0.01조원을 썼다.
  {
    id: 'regional-agri-logistics',
    name: '농·수산물 유통개선',
    gov: CENTRAL_GOV,
    ministry: '농식품부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 100,
    nature: 'new',
    spendType: 'equity',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '□ (총사업비) 1,812억원(국가 49% : 민간 51% 출자)',
        source: p100('공공 스마트 물류(유통)센터 구축'),
      },
      {
        field: 'spendType',
        quote: '* ‘27년 예산(안): 센터 구축 방안 수립을 위한 용역비와 출자금 반영',
        source: p100('공공 스마트 물류(유통)센터 구축'),
      },
      { field: 'nature', quote: ROUTE_LINE.regionalRural, source: SRC_PROMO },
      fund(ROUTE_LINE.regionalRural),
      {
        field: 'amount27Eok',
        quote: '□ 민관합동 SPC를 통해 공공이 직접 참여한 공공형 물류센터·유통법인 설립(‘27년 110억원, 총 0.2조원) 추진',
        source: p100('공공 스마트 물류(유통)센터 구축'),
      },
    ],
    sources: [SRC_PROMO, p100('공공 스마트 물류(유통)센터 구축')],
  },
  {
    id: 'regional-jeonnam-general',
    name: '전남·광주 통합지원금 (일반)',
    gov: CENTRAL_GOV,
    ministry: '행안부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 28500,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '□ (재정지원 4.35조원) 전남광주통합특별시장이 관리하는 지방기금인 ｢신설통합 지방정부지원기금｣으로 출연',
        source: p100('행정통합 재정 인센티브 지원'),
      },
      {
        field: 'nature',
        quote: '□ (사업기간) ’27~’30년(4년간 최대 20조원)',
        source: p100('행정통합 재정 인센티브 지원'),
      },
      fund(ROUTE_LINE.regionalMerge),
      {
        field: 'amount27Eok',
        quote:
          'ㅇ 기금 내 일반지원 계정(2.85조원)은 통합특별시의 성장동력 확충 및 정주여건 개선 용도, 반도체지원 계정(1.5조원)은 서남권 반도체 산업 육성 용도로 사용',
        source: p100('행정통합 재정 인센티브 지원'),
      },
    ],
    sources: [SRC_PROMO, p100('행정통합 재정 인센티브 지원')],
  },
  // 설계 §8의 열린 질문. transferred(사무와 함께 재원 이관)를 검토했으나, 문서가 이관된다고 적는
  // 것은 「사무」이고 0.65조원 자체는 ’27~’30년에 새로 주는 인센티브 재원이다. ’26년에 같은 사무에
  // 얼마를 썼는지는 어느 문서에도 없다. 숫자를 지어내지 않기 위해 new로 두고 근거를 남긴다.
  {
    id: 'regional-jeonnam-transfer',
    name: '전남·광주 통합지원금 (사무이관)',
    gov: CENTRAL_GOV,
    ministry: '행안부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 6500,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: '□ (사무이관 0.65조원) 특별행정기관 등 이관사무 연계 지원',
        source: p100('행정통합 재정 인센티브 지원'),
      },
      {
        field: 'nature',
        quote: '□ (사업내용) 행정통합 재정 인센티브로, 일반 재원 및 사무이관 연계재원 총 5조원 지원',
        source: p100('행정통합 재정 인센티브 지원'),
      },
      fund(ROUTE_LINE.regionalMerge),
      {
        field: 'amount27Eok',
        quote: '사무이관 연계재원 행안부 미래대응기금 전남광주통합특별시 이관 사무 지원 0.65',
        source: p100('행정통합 재정 인센티브 지원'),
      },
    ],
    sources: [SRC_PROMO, p100('행정통합 재정 인센티브 지원')],
  },
  // infra를 검토했으나 정부 지출의 형태가 건설이 아니라 융자·이차보전(금융 지원)이므로 grant.
  // 홍보자료 22쪽 표는 1,523억원. 계정 표의 0.15조원을 썼다.
  {
    id: 'regional-hotel',
    name: '지방 호텔 건립 지원',
    gov: CENTRAL_GOV,
    ministry: '문체부',
    area: 'k-shape',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 1500,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '- 현재 5성급 호텔이 없는 지방에 신축을 지원하기 위해 신규특별융자 및 이차보전 지원 신설(1,523억원, 3개소)',
        source: promo(22),
      },
      { field: 'nature', quote: ROUTE_LINE.regionalEtc, source: SRC_PROMO },
      fund(ROUTE_LINE.regionalEtc),
      {
        field: 'amount27Eok',
        quote: '- 지방 5성급 호텔 건립 - 1,523 · 1개소당 2년간 1,500억원, 3개소 신축',
        source: promo(22),
      },
    ],
    sources: [SRC_PROMO, promo(22)],
  },
  {
    id: 'regional-remainder',
    name: '(기타) 지방계정 잔여',
    gov: CENTRAL_GOV,
    ministry: '—',
    area: 'other',
    account: 'regional',
    amount26Eok: null,
    amount27Eok: 16200,
    nature: 'unknown',
    spendType: 'unknown',
    route: 'fund',
    evidence: [],
    sources: [SRC_PROMO],
    isRemainder: true,
  },

  // ───────── 교육·인재계정 사업지출 7.6조원 (여유자금 2.5조원 제외) ─────────
  // 4대 과기원·AI중심대학·창업중심대학은 홍보자료 7쪽 계정 표 말고는 어느 문서에도 설명이 없다.
  // 지원 방식(출연)을 적은 문장이 없어, 받는 쪽이 개인이 아니라 기관(과학기술원·대학)이라는
  // 사실만으로 설계 §3의 "기관·지자체·기업에 보조·출연 = grant"를 적용했다. 근거가 얇은 행이다.
  {
    id: 'edu-kaist4',
    name: '4대 과기원',
    gov: CENTRAL_GOV,
    ministry: '과기부',
    area: 'youth',
    account: 'education',
    amount26Eok: 7000,
    amount27Eok: 8000,
    nature: 'expanded',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      { field: 'nature', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      fund(ROUTE_LINE.eduTop),
    ],
    sources: [SRC_PROMO],
  },
  // 장학금은 설계 §3에서 cash(개인에게 지급)로 분류한다. 인용문에 사업명이 그대로 들어 있다.
  {
    id: 'edu-stem-scholarship',
    name: '이공계 장학금',
    gov: CENTRAL_GOV,
    ministry: '과기부',
    area: 'youth',
    account: 'education',
    amount26Eok: 1000,
    amount27Eok: 2000,
    nature: 'expanded',
    spendType: 'cash',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      { field: 'nature', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      fund(ROUTE_LINE.eduTop),
    ],
    sources: [SRC_PROMO],
  },
  // 청년정책 개요도는 창업중심대학을 (’26) 883 →(’27) 1,083억원(청년지원분)으로 적어 기존 사업임을
  // 보여준다. 그러나 기금 계정 표는 「신규0.1조원」으로 적는다. 기금 몫 기준인 계정 표를 따랐다.
  {
    id: 'edu-startup-univ',
    name: '창업중심대학',
    gov: CENTRAL_GOV,
    ministry: '중기부',
    area: 'youth',
    account: 'education',
    amount26Eok: null,
    amount27Eok: 1000,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      { field: 'nature', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      fund(ROUTE_LINE.eduTop),
      { field: 'amount27Eok', quote: '창업중심대학 (’26) 883 →(’27) 1,083억원', source: SRC_YOUTH },
    ],
    sources: [SRC_PROMO, SRC_YOUTH],
  },
  {
    id: 'edu-ai-univ',
    name: 'AI중심대학',
    gov: CENTRAL_GOV,
    ministry: '과기부',
    area: 'youth',
    account: 'education',
    amount26Eok: 1000,
    amount27Eok: 2000,
    nature: 'expanded',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      { field: 'nature', quote: ROUTE_LINE.eduTop, source: SRC_PROMO },
      fund(ROUTE_LINE.eduTop),
    ],
    sources: [SRC_PROMO],
  },
  // 계획의 잠정값은 cash 또는 service였으나, 문서상 받는 쪽은 21개 지방국립대(기관)이고 용도는
  // 석학유치·첨단연구 자율 투자다. 학생에게 주는 학자금이 아니므로 grant.
  {
    id: 'edu-talent-fund',
    name: '미래인재성장자금',
    gov: CENTRAL_GOV,
    ministry: '교육부',
    area: 'youth',
    account: 'education',
    amount26Eok: null,
    amount27Eok: 7000,
    nature: 'new',
    spendType: 'grant',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          '(인프라) 21개 지방국립대(교대 제외)가 석학유치·첨단연구 등에 자율 투자할 수 있도록 신규미래인재성장자금 지원(0.7조원)',
        source: promo(33),
      },
      { field: 'nature', quote: ROUTE_LINE.eduHigher, source: SRC_PROMO },
      fund(ROUTE_LINE.eduHigher),
      {
        field: 'amount27Eok',
        quote: '* 거점국립대 9개교 평균 500억원, 일반 지방국립대 12개교 평균 200억원 등',
        source: promo(53),
      },
    ],
    sources: [SRC_PROMO, promo(33), promo(53)],
  },
  {
    id: 'edu-teacher-ratio',
    name: '교사·아동비율 개선',
    gov: CENTRAL_GOV,
    ministry: '교육부',
    area: 'youth',
    account: 'education',
    amount26Eok: 3000,
    amount27Eok: 5000,
    nature: 'expanded',
    spendType: 'service',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote: 'ㅇ 3~5세 무상교육·보육 완성, 교사대 아동비율 개선 등 서비스 질 제고',
        source: promo(53),
      },
      { field: 'nature', quote: ROUTE_LINE.eduHigher, source: SRC_PROMO },
      fund(ROUTE_LINE.eduHigher),
    ],
    sources: [SRC_PROMO, promo(53)],
  },
  {
    id: 'edu-national-univ-scholarship',
    name: '지방국립대 전액장학금',
    gov: CENTRAL_GOV,
    ministry: '교육부',
    area: 'youth',
    account: 'education',
    amount26Eok: null,
    amount27Eok: 2000,
    nature: 'new',
    spendType: 'cash',
    route: 'fund',
    evidence: [
      {
        field: 'spendType',
        quote:
          "(장학금) 청년이 지역에서 배우고 성장할 수 있도록 '27년 신입생부터 신규지방국립대(30개교, 의·치·약·수 제외) 등록금 전액장학금 지원(0.2조원)",
        source: promo(33),
      },
      { field: 'nature', quote: ROUTE_LINE.eduHigher, source: SRC_PROMO },
      fund(ROUTE_LINE.eduHigher),
      {
        field: 'amount27Eok',
        quote: '✓(국가장학금) 지방국립대(30개교) 무상교육 실시 * 의대·치대·약대·수의대 제외',
        source: promo(8),
      },
    ],
    sources: [SRC_PROMO, promo(33), promo(8)],
  },
  // 홍보자료 25쪽 표와 청년정책 개요도는 「대학생 첫경력 프로젝트」를 4,650억원으로 적는다.
  // 계정 표의 0.5조원을 썼다.
  {
    id: 'edu-intern-semester',
    name: '인턴학기제',
    gov: CENTRAL_GOV,
    ministry: '교육부',
    area: 'youth',
    account: 'education',
    amount26Eok: null,
    amount27Eok: 5000,
    nature: 'new',
    spendType: 'service',
    route: 'fund',
    beneficiaries: { value: 60000, unit: '명', source: promo(53) },
    evidence: [
      {
        field: 'spendType',
        quote:
          'ㅇ 취업 전에 직무경험을 쌓도록 신규대학생 인턴학기(0.5조원)를 도입하여 전문대·일반대 6만명에게 유급 일경험 제공',
        source: promo(53),
      },
      { field: 'nature', quote: ROUTE_LINE.eduHigher, source: SRC_PROMO },
      fund(ROUTE_LINE.eduHigher),
      {
        field: 'beneficiaries',
        quote:
          'ㅇ 취업 전에 직무경험을 쌓도록 신규대학생 인턴학기(0.5조원)를 도입하여 전문대·일반대 6만명에게 유급 일경험 제공',
        source: promo(53),
      },
      {
        field: 'amount27Eok',
        quote: '-청년 첫경력 프로젝트 - 4,650 · 대학생 6만명에게 인턴학기 지원',
        source: promo(25),
      },
    ],
    sources: [SRC_PROMO, promo(53), promo(25)],
  },
  {
    id: 'edu-remainder',
    name: '(기타) 교육·인재계정 잔여',
    gov: CENTRAL_GOV,
    ministry: '—',
    area: 'other',
    account: 'education',
    amount26Eok: null,
    amount27Eok: 44000,
    nature: 'unknown',
    spendType: 'unknown',
    route: 'fund',
    evidence: [],
    sources: [SRC_PROMO],
    isRemainder: true,
  },
];
