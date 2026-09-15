# 사업 검토 시뮬레이터 1단계 구현 계획

> **상태 (2026-09-15): 1단계 완료.** 커밋 1289b21 → 08e6c09. 검증 결과는 설계문서 §8 참조. 계획과 달라진 점: 행 수 35 → 38(3종 패키지 3분할, 창업사업화 별도 행), 분류 근거가 없는 행은 점수·재배분에서 제외하는 `classificationNote` 규칙 추가, `scripts/verify-program-quotes.mjs` 추가.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 미래대응기금 4대 계정 주요사업 35행(31 + 잔여 4)을 검증 가능한 렌즈로 기술하고, 독자가 가중치를 정하면 순위·재배분이 바뀌는 계산기를 `/disputes/future-fund` 「숫자로 보기」에 붙인다.

**Architecture:** 데이터·계산은 `src/lib/programs/`(순수 TS, components import 금지), 화면은 `src/components/disputes/calculators/ProgramReview*.tsx`. 기존 `CalculatorKey` 레지스트리에 `'program-review'`를 추가하되, 분쟁 하나에 계산기 여러 개를 두기 위해 `Dispute.calculator` → `calculators: CalculatorKey[]`로 바꾼다. 스키마는 처음부터 정부 단위(`gov`)를 가져 2~5단계(중점투자 전체·100대·광역·자치구)에서 행만 추가한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Jest(ts-jest, `@/` 매핑).

**Spec:** `docs/superpowers/specs/2026-09-15-program-review-simulator-design.md` — 실행자는 이 계획과 설계문서를 함께 읽는다. 특히 §2(사업 목록·잔여 규칙), §3(분류 규칙), §4(렌즈 표·프리셋·재배분 불변식).

## Global Constraints

- `any` 금지, 인라인 스타일 금지, 클라이언트 컴포넌트에서 `console.*` 금지 (프로젝트 CLAUDE.md)
- `lib`는 `components`를 import하지 않는다. 컴포넌트 파일 300줄 이하.
- 모든 수치는 출처 필수. 역산값은 `[역산]` 표시(`FIGURE_KIND_LABEL`).
- 효과·성과 추정 필드·계산 금지 (설계 §7).
- 원자료 위치(이 PC, gitignore): `data/mpb2027/02_홍보자료.txt` 270~315행(계정별 주요사업), `data/mpb2027/07_100대신규사업.txt`(사업별 개요), `data/mpb2027/youth/10b_청년정책개요도_최최종.txt`(청년 사업 억 단위). 인용문은 이 파일들에서 그대로 복사한다. 문서에 없는 문장을 만들지 않는다.
- 커밋은 태스크 단위. 메시지 끝: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 푸시·배포는 사용자 지시가 있을 때만.
- `Slider`·`Figure`는 `FundScenario.tsx`의 함수를 그대로 복사해 쓴다(공용화 금지 — 별도 작업).

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/lib/programs/types.ts` | Program·GovUnit·렌즈 키·가중치·프리셋 타입 (신규) |
| `src/lib/programs/gov.ts` | `CENTRAL_GOV` 상수, `assertSameGov()` (신규) |
| `src/lib/programs/data/central-future-fund.ts` | 1단계 35행 (신규) |
| `src/lib/programs/index.ts` | `ALL_PROGRAMS`, `programsOf(gov)` (신규) |
| `src/lib/programs/scoring.ts` | 렌즈 값·점수·순위 (신규) |
| `src/lib/programs/reallocation.ts` | 재배분 (신규) |
| `src/lib/programs/__tests__/{programs,scoring,reallocation}.test.ts` | (신규) |
| `src/lib/disputes/types.ts` | `CALCULATOR_KEYS`에 `'program-review'`, `calculator?` → `calculators?: CalculatorKey[]` (수정) |
| `src/lib/disputes/{education-grant,future-fund}.ts` | `calculators: [...]` (수정) |
| `src/lib/disputes/__tests__/disputes.test.ts` | calculators 배열 검사 (수정) |
| `src/app/disputes/[slug]/page.tsx` | 계산기 여러 개 렌더 (수정) |
| `src/components/disputes/calculators/index.ts` | 레지스트리에 ProgramReview (수정) |
| `src/components/disputes/calculators/ProgramReview.tsx` | 상태·조합 (신규, ≤200줄) |
| `src/components/disputes/calculators/program-review/WeightPanel.tsx` | 프리셋·슬라이더 (신규) |
| `src/components/disputes/calculators/program-review/RankingTable.tsx` | 순위표·펼침 (신규) |
| `src/components/disputes/calculators/program-review/ReallocationPanel.tsx` | 재배분 입력·결과 (신규) |
| `src/components/disputes/calculators/program-review/labels.ts` | 열거형 → 한글 라벨 (신규) |

---

### Task 1: 타입과 정부 단위

**Files:**
- Create: `src/lib/programs/types.ts`
- Create: `src/lib/programs/gov.ts`
- Test: `src/lib/programs/__tests__/programs.test.ts` (이 태스크에서는 gov 검사만)

**Interfaces:**
- Produces: `Program`, `GovUnit`, `GovLevel`, `LensKey`, `Weights`, `Preset`, `CENTRAL_GOV`, `assertSameGov(programs)`, `isValidGovCode(gov)`

- [x] **Step 1: 실패하는 테스트**

```ts
// src/lib/programs/__tests__/programs.test.ts
import { CENTRAL_GOV, assertSameGov, isValidGovCode } from '../gov';
import type { Program } from '../types';

const base = (over: Partial<Program>): Program => ({
  id: 'x', name: 'x', gov: CENTRAL_GOV, ministry: 'x', area: 'youth', account: 'youth',
  amount26Eok: null, amount27Eok: 100, nature: 'new', spendType: 'cash', route: 'fund',
  evidence: [], sources: ['t'], ...over,
});

describe('정부 단위', () => {
  it('중앙은 code 00, 시도는 2자리, 시군구는 5자리만 허용한다', () => {
    expect(isValidGovCode({ level: 'central', code: '00', name: '중앙정부' })).toBe(true);
    expect(isValidGovCode({ level: 'metro', code: '11', name: '서울' })).toBe(true);
    expect(isValidGovCode({ level: 'district', code: '11110', name: '종로구' })).toBe(true);
    expect(isValidGovCode({ level: 'metro', code: '11110', name: '서울' })).toBe(false);
    expect(isValidGovCode({ level: 'central', code: '11', name: '중앙' })).toBe(false);
  });

  it('서로 다른 정부의 사업을 섞으면 throw', () => {
    const seoul = { level: 'metro' as const, code: '11', name: '서울특별시' };
    expect(() => assertSameGov([base({}), base({ id: 'y', gov: seoul })])).toThrow(/gov/);
    expect(() => assertSameGov([base({}), base({ id: 'y' })])).not.toThrow();
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `npx jest src/lib/programs -v`
Expected: FAIL — `Cannot find module '../gov'`

- [x] **Step 3: 타입 파일**

```ts
// src/lib/programs/types.ts
/**
 * 사업 검토 시뮬레이터 데이터 모델 (설계문서 §3).
 * 효과·성과 필드는 없다. 추가하려면 설계문서를 먼저 고친다.
 */
export type ProgramArea = 'mega-ai' | 'growth-engine' | 'youth' | 'k-shape' | 'safety' | 'other';
export type FundAccount = 'youth' | 'growth' | 'regional' | 'education' | 'none';
/** new 신규 / expanded 확대 / transferred 기존 급여·사업의 재원 이관 / tax-converted 조세지출→재정 전환 */
export type ProgramNature = 'new' | 'expanded' | 'transferred' | 'tax-converted' | 'unknown';
/** cash 개인 현금·바우처·장학금 / matched-saving 기여금 / grant 기관 보조·출연 / equity 출자 / rnd / infra / service */
export type SpendType =
  | 'cash' | 'matched-saving' | 'grant' | 'equity' | 'rnd' | 'infra' | 'service' | 'unknown';
/** 중앙: budget 본예산 / fund 기금. 지방: budget 일반회계 / special-account 특별회계 / fund 기금 */
export type ReviewRoute = 'budget' | 'fund' | 'special-account' | 'unknown';

export type GovLevel = 'central' | 'metro' | 'district';
/** 행정표준코드. 중앙 '00', 시도 2자리, 시군구 5자리 */
export interface GovUnit { level: GovLevel; code: string; name: string }

export interface ProgramUnit {
  price: string;
  count: string;
  /** 억원 */
  product: number;
  /** amount27Eok와 ±1% 안이면 true */
  matches: boolean;
  note?: string;
}

export interface ProgramEvidence {
  field: 'spendType' | 'nature' | 'route' | 'unit' | 'beneficiaries' | 'amount27Eok';
  /** 원자료 문장 그대로 */
  quote: string;
  source: string;
}

export interface Program {
  id: string;
  name: string;
  gov: GovUnit;
  ministry: string;
  area: ProgramArea;
  account: FundAccount;
  /** 억원. 신규면 null */
  amount26Eok: number | null;
  /** 억원 */
  amount27Eok: number;
  nature: ProgramNature;
  spendType: SpendType;
  route: ReviewRoute;
  unit?: ProgramUnit;
  beneficiaries?: { value: number; unit: string; source: string };
  evidence: ProgramEvidence[];
  sources: string[];
  /** 계정 「기타」 잔여 행. 점수 없음, 총액에는 포함 */
  isRemainder?: boolean;
}

export const LENS_KEYS = ['capital', 'netNew', 'execution', 'route', 'reach', 'check'] as const;
export type LensKey = (typeof LENS_KEYS)[number];
/** 가중치 0~3 정수 */
export type Weights = Record<LensKey, 0 | 1 | 2 | 3>;
export interface Preset { id: string; name: string; note: string; weights: Weights }
```

```ts
// src/lib/programs/gov.ts
import type { GovUnit, Program } from './types';

export const CENTRAL_GOV: GovUnit = { level: 'central', code: '00', name: '중앙정부' };

const CODE_LENGTH: Record<GovUnit['level'], number> = { central: 2, metro: 2, district: 5 };

export function isValidGovCode(gov: GovUnit): boolean {
  if (!/^\d+$/.test(gov.code)) return false;
  if (gov.level === 'central') return gov.code === '00';
  return gov.code.length === CODE_LENGTH[gov.level];
}

/** 점수·재배분은 한 정부 단위 안에서만 한다. 섞이면 계산 자체를 거부한다 */
export function assertSameGov(programs: readonly Program[]): void {
  const first = programs[0];
  if (!first) return;
  for (const p of programs) {
    if (p.gov.level !== first.gov.level || p.gov.code !== first.gov.code) {
      throw new Error(`서로 다른 gov의 사업을 섞을 수 없다: ${first.gov.code} vs ${p.gov.code}`);
    }
  }
}
```

- [x] **Step 4: 통과 확인**

Run: `npx jest src/lib/programs -v`
Expected: PASS 2 tests. `npx tsc --noEmit` 통과.

- [x] **Step 5: 커밋**

```bash
git add src/lib/programs/types.ts src/lib/programs/gov.ts src/lib/programs/__tests__/programs.test.ts
git commit -m "feat(programs): 사업 검토 데이터 모델과 정부 단위 타입"
```

---

### Task 2: 1단계 데이터 35행

**Files:**
- Create: `src/lib/programs/data/central-future-fund.ts`
- Create: `src/lib/programs/index.ts`
- Modify: `src/lib/programs/__tests__/programs.test.ts` (무결성 검사 추가)

**Interfaces:**
- Consumes: `Program`, `CENTRAL_GOV`
- Produces: `CENTRAL_FUTURE_FUND_PROGRAMS: readonly Program[]`, `ALL_PROGRAMS`, `programsOf(gov: GovUnit): Program[]`, `ACCOUNT_TOTAL_EOK: Record<Exclude<FundAccount,'none'>, number>`

- [x] **Step 1: 실패하는 무결성 테스트 (기존 파일에 추가)**

```ts
import { ALL_PROGRAMS, ACCOUNT_TOTAL_EOK } from '../index';
import { isValidGovCode } from '../gov';

describe('1단계 데이터 무결성', () => {
  const rows = ALL_PROGRAMS.filter((p) => p.gov.code === '00');

  it('id 중복 없음, gov 코드 유효', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) expect(isValidGovCode(r.gov)).toBe(true);
  });

  it('계정별 합계가 홍보자료 사업지출과 억 단위까지 일치한다', () => {
    const sum = (acc: string) =>
      rows.filter((r) => r.account === acc).reduce((s, r) => s + r.amount27Eok, 0);
    expect(sum('youth')).toBe(133_000);
    expect(sum('growth')).toBe(142_000);
    expect(sum('regional')).toBe(103_000);
    expect(sum('education')).toBe(76_000);
    expect(rows.reduce((s, r) => s + r.amount27Eok, 0)).toBe(454_000);
    expect(ACCOUNT_TOTAL_EOK).toEqual({ youth: 133_000, growth: 142_000, regional: 103_000, education: 76_000 });
  });

  it('잔여 행은 계정마다 정확히 하나이고 분류가 unknown이다', () => {
    const rem = rows.filter((r) => r.isRemainder);
    expect(rem.map((r) => r.account).sort()).toEqual(['education', 'growth', 'regional', 'youth']);
    for (const r of rem) {
      expect(r.spendType).toBe('unknown');
      expect(r.nature).toBe('unknown');
      expect(r.amount27Eok).toBeGreaterThan(0);
    }
  });

  it('잔여가 아닌 행은 spendType·nature·route 근거 인용문과 출처가 있다', () => {
    for (const r of rows.filter((r) => !r.isRemainder)) {
      expect(r.sources.length).toBeGreaterThan(0);
      for (const f of ['spendType', 'nature', 'route'] as const) {
        const e = r.evidence.find((x) => x.field === f);
        if (!e) throw new Error(`${r.id}.${f} 근거 없음`);
        expect(e!.quote.length).toBeGreaterThan(5);
        expect(e!.source.length).toBeGreaterThan(0);
      }
      expect(r.spendType).not.toBe('unknown');
      expect(r.nature).not.toBe('unknown');
    }
  });

  it('단가×수량이 있으면 matches가 ±1% 규칙과 맞는다', () => {
    for (const r of rows) {
      if (!r.unit) continue;
      const within = Math.abs(r.unit.product - r.amount27Eok) / r.amount27Eok <= 0.01;
      expect(r.unit.matches).toBe(within);
    }
  });

  it('신규(new)는 amount26Eok이 null이고, 확대·이관·전환은 숫자다', () => {
    for (const r of rows.filter((r) => !r.isRemainder)) {
      if (r.nature === 'new') expect(r.amount26Eok).toBeNull();
      else expect(typeof r.amount26Eok).toBe('number');
    }
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `npx jest src/lib/programs/__tests__/programs.test.ts`
Expected: FAIL — `Cannot find module '../index'`

- [x] **Step 3: 데이터 파일 작성**

행 목록과 금액(억원)은 아래 표를 그대로 쓴다. **분류(spendType·nature)는 잠정값**이다 — 원자료에서 근거 문장을 찾아 `evidence`에 인용하고, 문서가 잠정값과 다르면 문서를 따르고 파일 주석에 이유를 적는다. 근거 문장이 어디에도 없으면 `unknown`으로 두지 말고 이 태스크를 멈추고 보고한다. 모든 1단계 행은 `route: 'fund'`(근거: 홍보자료 7쪽 「미래대응기금 주요사업」 표에 실려 있음 — 인용문은 해당 계정 줄).

| id | account | name | ministry | a26 | a27 | nature | spendType | 근거 찾을 곳 |
|---|---|---|---|---|---|---|---|---|
| youth-first-job | youth | 청년첫취업지원제도 | 노동부 | null | 3793 | new | (문서 판단: 현금 지급이면 cash, 훈련·매칭이면 service) | 100대 「청년첫취업지원제도」, 개요도 |
| youth-startup-commercialization | youth | 창업사업화 | 중기부 | (홍보자료에 없음 → 100대·개요도 「모두의창업」 확인, 없으면 null 대신 unknown-금액 문제로 보고) | 10000 | expanded 또는 new (문서 확인) | grant | 홍보자료 7쪽, 100대 |
| youth-universal-rental | youth | 보편형 공공임대주택 (기금 몫) | 국토부 | null | 14000 | new | infra | 홍보자료 7쪽 "신규1.4조원", 개요도 "청년보편형임대주택 신규 38,300억원" — note에 기금 몫 1.4조와 사업 총액 3.83조가 다름을 적는다 |
| youth-future-savings | youth | 청년미래적금 | 금융위 | 7446 | 17011 | expanded | matched-saving | 개요도, 홍보자료 "소득요건을 폐지하여 대상을 모든 청년으로 확대" |
| youth-opportunity-fund | youth | 청년기회자금 | 금융위 | null | 1027 | new | (문서 판단) | 100대 |
| youth-marriage-grant | youth | 혼인지원금 | 성평등부 | null | 1663 | tax-converted | cash | 100대 "혼인신고 시 부부당 100만원 현금 지급(생애 1회)", "기존 혼인세액공제를 재정전환". unit: 100만원 × 48만명 = 4,800억? — 100대는 1,654억이라 적음: **문서의 48만명은 세액공제 대상 수치일 수 있으니 unit은 문서에 단가×수량이 명시된 경우만**. 명시 없으면 unit 생략 |
| youth-newborn-grant | youth | 아이맞이지원금 | 복지부 | 4111 | 6981 | tax-converted | cash | 100대 「출산지원금」, 홍보자료 "혼인·출산세액공제(0.3조원) → 혼인·아이맞이지원금 신설(0.9조원)" |
| youth-child-allowance | youth | 아동기본수당 | 복지부 | 24822 | 29272 | transferred | cash | 개요도(’26 24,822 존재), 홍보자료 7쪽 3종 패키지에 포함 — evidence.nature 인용: 개요도의 "(’26) 24,822 →(’27) 29,272억원" + 홍보자료 3종 패키지 줄 |
| youth-culture-pass | youth | 청년문화예술패스 | 문체부 | 361 | 7925 | expanded | cash | 개요도, 홍보자료 "모든 청년 대상, 매년 지원". 바우처 = cash 규칙 |
| youth-remainder | youth | (기타) 청년계정 잔여 | — | null | 133000 − 위 합계 | unknown | unknown | isRemainder: true, evidence [] |
| growth-frontier-ai | growth | 프론티어급 AI 개발 | 과기부 | null | 47000 | new | rnd | 홍보자료 7쪽, 100대 |
| growth-ai-for-all | growth | 모두의 AI | 과기부 | null | 2500 | new | service | 100대 "대국민 AI 서비스" |
| growth-tacit-ai | growth | 제조암묵지 R&D | 산업부 | null | 3000 | new | rnd | 100대 「제조암묵지활용AI솔루션개발(R&D)」 |
| growth-aidc | growth | AIDC 생태계 | 과기부·산업부 | null | 3000 | new | rnd | 100대 「AIDC 소부장·클라우드 기술개발·고도화(R&D)」 |
| growth-autonomous-city | growth | 자율주행 실증도시 | 국토부 | 1000 | 8000 | expanded | infra (실증 인프라) 또는 rnd — 문서 판단 | 100대 |
| growth-launcher | growth | 차세대 발사체 | 우주청 | 1000 | 3000 | expanded | rnd | 100대 |
| growth-supply-chain | growth | 공급망안정화 | 재경부 | (확인) | 2000 | (확인) | equity | 홍보자료 "③(지분투자)" |
| growth-pf-fund | growth | PF사업장 정상화 펀드 | 금융위 | null | 5000 | new | equity | 홍보자료 "③(지분투자)" |
| growth-kepco-equity | growth | 한전 출자 | 기후부 | null | 5000 | new | equity | 홍보자료 "한전출자" |
| growth-semicon-water | growth | 서남권 반도체산단 용수 | 기후부 | null | 1000 | new | infra | 홍보자료, 100대 |
| growth-remainder | growth | (기타) 성장동력계정 잔여 | — | null | 142000 − 위 합계 | unknown | unknown | isRemainder |
| regional-growth-grant | regional | 지방미래성장지원금 | 행안부 | null | 35000 | new | grant | 홍보자료 "①(일반재원)", 100대 |
| regional-living-center | regional | 국민생활편의 복합센터 | 행안부 | null | 15000 | new | infra | 100대 |
| regional-agri-ax | regional | 농업 AX 실증 | 농식품부 | null | 200 | new | (문서 판단) | 100대 |
| regional-agri-logistics | regional | 농·수산물 유통개선 | 농식품부 | null | 100 | new | (문서 판단) | 100대 |
| regional-jeonnam-general | regional | 전남·광주 통합지원금 (일반) | 행안부 | null | 28500 | new | grant | 홍보자료 "일반2.85조원", 100대 |
| regional-jeonnam-transfer | regional | 전남·광주 통합지원금 (사무이관) | 행안부 | null | 6500 | transferred (사무와 재원 이관이면) — 100대 문장으로 판단 | grant | 100대 |
| regional-hotel | regional | 지방 호텔 건립 지원 | 문체부 | null | 1500 | new | infra 또는 grant — 문서 판단 | 100대 |
| regional-remainder | regional | (기타) 지방계정 잔여 | — | null | 103000 − 위 합계 | unknown | unknown | isRemainder |
| edu-kaist4 | education | 4대 과기원 | 과기부 | 7000 | 8000 | expanded | grant (출연) | 홍보자료 |
| edu-stem-scholarship | education | 이공계 장학금 | 과기부 | 1000 | 2000 | expanded | cash | 홍보자료. 장학금 = cash 규칙 |
| edu-startup-univ | education | 창업중심대학 | 중기부 | null | 1000 | new | grant | 홍보자료 |
| edu-ai-univ | education | AI중심대학 | 과기부 | 1000 | 2000 | expanded | grant | 홍보자료 |
| edu-talent-fund | education | 미래인재성장자금 | 교육부 | null | 7000 | new | (문서 판단: 학자금 대출이면 matched-saving 아님 → 'cash' 또는 'service', 100대 확인) | 100대 |
| edu-teacher-ratio | education | 교사·아동비율 개선 | 교육부 | 3000 | 5000 | expanded | service | 홍보자료, 100대 |
| edu-national-univ-scholarship | education | 지방국립대 전액장학금 | 교육부 | null | 2000 | new | cash | 홍보자료 |
| edu-intern-semester | education | 인턴학기제 | 교육부 | null | 5000 | new | service | 100대 |
| edu-remainder | education | (기타) 교육·인재계정 잔여 | — | null | 76000 − 위 합계 | unknown | unknown | isRemainder |

잔여 계산(잠정, 위 금액 기준): 청년 133,000 − 91,672 = 41,328 / 성장동력 142,000 − 79,500 = 62,500 / 지방 103,000 − 86,800 = 16,200 / 교육·인재 76,000 − 32,000 = 44,000. **창업사업화 등 금액을 문서로 바꾸면 잔여도 다시 계산한다.** 테스트가 합계를 잠근다.

파일 골격:

```ts
// src/lib/programs/data/central-future-fund.ts
import type { Program } from '../types';
import { CENTRAL_GOV } from '../gov';

const SRC_PROMO = '기획예산처 2027년 예산안 홍보자료 7쪽 「미래대응기금 주요사업」';
const SRC_100 = '기획예산처 100대 신규사업';
const SRC_YOUTH = '기획예산처 2027년 청년정책 주요내용 개요도 (2026-09-01)';

const fund = (field: 'route', account: string): Program['evidence'][number] => ({
  field,
  quote: `${account} 계정 주요사업으로 열거 — 미래대응기금 사업지출`,
  source: SRC_PROMO,
});

export const CENTRAL_FUTURE_FUND_PROGRAMS: readonly Program[] = [
  {
    id: 'youth-future-savings',
    name: '청년미래적금',
    gov: CENTRAL_GOV,
    ministry: '금융위원회',
    area: 'youth',
    account: 'youth',
    amount26Eok: 7446,
    amount27Eok: 17011,
    nature: 'expanded',
    spendType: 'matched-saving',
    route: 'fund',
    evidence: [
      { field: 'spendType', quote: '<원자료 문장>', source: SRC_100 },
      { field: 'nature', quote: '소득요건을 폐지하여 대상을 모든 청년으로 확대', source: '기획예산처 2027년 예산안 홍보자료' },
      fund('route', '청년'),
      { field: 'amount27Eok', quote: '청년미래적금 (’26) 7,446 →(’27) 17,011억원', source: SRC_YOUTH },
    ],
    sources: [SRC_PROMO, SRC_YOUTH],
  },
  // … 나머지 행
];
```

```ts
// src/lib/programs/index.ts
import type { FundAccount, GovUnit, Program } from './types';
import { CENTRAL_FUTURE_FUND_PROGRAMS } from './data/central-future-fund';

export const ALL_PROGRAMS: readonly Program[] = [...CENTRAL_FUTURE_FUND_PROGRAMS];

export function programsOf(gov: GovUnit): Program[] {
  return ALL_PROGRAMS.filter((p) => p.gov.level === gov.level && p.gov.code === gov.code);
}

/** 홍보자료 7쪽 계정별 사업지출 (억원). 여유자금 제외 */
export const ACCOUNT_TOTAL_EOK: Record<Exclude<FundAccount, 'none'>, number> = {
  youth: 133_000,
  growth: 142_000,
  regional: 103_000,
  education: 76_000,
};

export * from './types';
export * from './gov';
```

- [x] **Step 4: 통과 확인**

Run: `npx jest src/lib/programs -v` → 전부 PASS. `npx tsc --noEmit` 통과.

- [x] **Step 5: 커밋**

```bash
git add src/lib/programs
git commit -m "feat(programs): 미래대응기금 4대 계정 주요사업 35행 — 원자료 인용 근거 포함"
```

---

### Task 3: 렌즈·점수·순위

**Files:**
- Create: `src/lib/programs/scoring.ts`
- Test: `src/lib/programs/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: `Program`, `Weights`, `LensKey`, `LENS_KEYS`, `assertSameGov`
- Produces:
  - `lensValues(p: Program, ctx: { maxBeneficiaries: number }): Partial<Record<LensKey, number>>` — 값이 없는 렌즈는 키 자체가 없다
  - `scoreProgram(p, weights, ctx): number | undefined`
  - `rankPrograms(programs, weights): RankedProgram[]` — `{ program, score?: number, lenses }`, 점수 내림차순, 점수 없는 행은 금액 내림차순으로 뒤에. 가중치 전부 0이면 전부 금액 내림차순
  - `PRESETS: Preset[]` (설계 §4 표 그대로 3개), `ZERO_WEIGHTS`

- [x] **Step 1: 실패하는 테스트**

```ts
// src/lib/programs/__tests__/scoring.test.ts
import { lensValues, rankPrograms, PRESETS, ZERO_WEIGHTS } from '../scoring';
import { CENTRAL_GOV } from '../gov';
import type { Program, Weights } from '../types';

const mk = (over: Partial<Program>): Program => ({
  id: over.id ?? 'p', name: 'p', gov: CENTRAL_GOV, ministry: 'm', area: 'youth', account: 'youth',
  amount26Eok: null, amount27Eok: 1000, nature: 'new', spendType: 'cash', route: 'fund',
  evidence: [], sources: ['s'], ...over,
});
const W = (o: Partial<Weights>): Weights =>
  ({ capital: 0, netNew: 0, execution: 0, route: 0, reach: 0, check: 0, ...o });

describe('렌즈 값', () => {
  it('자본축적성: equity/rnd/infra/matched-saving=1, service/grant=0.5, cash=0, unknown은 키 없음', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ spendType: 'equity' }), ctx).capital).toBe(1);
    expect(lensValues(mk({ spendType: 'grant' }), ctx).capital).toBe(0.5);
    expect(lensValues(mk({ spendType: 'cash' }), ctx).capital).toBe(0);
    expect('capital' in lensValues(mk({ spendType: 'unknown' }), ctx)).toBe(false);
  });

  it('집행 위험: 배율 1.5 이하 1, 10 이상 0, 신규 0.5, 사이는 log 보간', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ amount26Eok: 1000, amount27Eok: 1200, nature: 'expanded' }), ctx).execution).toBe(1);
    expect(lensValues(mk({ amount26Eok: 361, amount27Eok: 7925, nature: 'expanded' }), ctx).execution).toBe(0);
    expect(lensValues(mk({ nature: 'new' }), ctx).execution).toBe(0.5);
    const mid = lensValues(mk({ amount26Eok: 1000, amount27Eok: 3873, nature: 'expanded' }), ctx).execution!; // 배율 ≈ √(1.5·10)
    expect(mid).toBeCloseTo(0.5, 1);
  });

  it('순증: new/expanded 1, tax-converted 0.5, transferred 0', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ nature: 'transferred', amount26Eok: 1 }), ctx).netNew).toBe(0);
    expect(lensValues(mk({ nature: 'tax-converted', amount26Eok: 1 }), ctx).netNew).toBe(0.5);
  });

  it('검산·수혜: 없으면 키 없음', () => {
    const v = lensValues(mk({}), { maxBeneficiaries: 1 });
    expect('check' in v).toBe(false);
    expect('reach' in v).toBe(false);
  });
});

describe('순위', () => {
  const rows = [
    mk({ id: 'a', spendType: 'equity', amount27Eok: 100 }),
    mk({ id: 'b', spendType: 'cash', amount27Eok: 900 }),
    mk({ id: 'r', isRemainder: true, spendType: 'unknown', nature: 'unknown', amount27Eok: 500 }),
  ];

  it('가중치 전부 0이면 점수 없이 금액 내림차순', () => {
    const r = rankPrograms(rows, ZERO_WEIGHTS);
    expect(r.map((x) => x.program.id)).toEqual(['b', 'r', 'a']);
    expect(r.every((x) => x.score === undefined)).toBe(true);
  });

  it('자본축적성 가중치만 주면 equity가 cash보다 앞서고 잔여는 맨 뒤', () => {
    const r = rankPrograms(rows, W({ capital: 3 }));
    expect(r.map((x) => x.program.id)).toEqual(['a', 'b', 'r']);
    expect(r[2].score).toBeUndefined();
  });

  it('값이 없는 렌즈는 분모에서 빠진다', () => {
    const r = rankPrograms([mk({ id: 'a', spendType: 'equity' })], W({ capital: 3, check: 3 }));
    expect(r[0].score).toBe(1); // check 없음 → capital만으로 평균
  });

  it('프리셋은 3개이고 이름이 설계문서와 같다', () => {
    expect(PRESETS.map((p) => p.name)).toEqual(['정부 기준 (NEXT 원칙)', '국회 통제 우선', '자산형성 우선']);
  });

  it('서로 다른 정부의 사업을 섞으면 throw', () => {
    const seoul = { level: 'metro' as const, code: '11', name: '서울' };
    expect(() => rankPrograms([mk({ id: 'a' }), mk({ id: 'b', gov: seoul })], ZERO_WEIGHTS)).toThrow();
  });
});
```

- [x] **Step 2: 실패 확인** — `npx jest src/lib/programs/__tests__/scoring.test.ts` → `Cannot find module '../scoring'`

- [x] **Step 3: 구현**

```ts
// src/lib/programs/scoring.ts
import { LENS_KEYS, type LensKey, type Preset, type Program, type Weights } from './types';
import { assertSameGov } from './gov';

export const ZERO_WEIGHTS: Weights = { capital: 0, netNew: 0, execution: 0, route: 0, reach: 0, check: 0 };

/** 설계문서 §4 프리셋. 「정부 기준」은 NEXT 중 데이터로 표현되는 N·X만 반영 */
export const PRESETS: Preset[] = [
  { id: 'government', name: '정부 기준 (NEXT 원칙)', note: 'N 자본축적·X 탄력 집행만 데이터로 표현된다', weights: { capital: 3, netNew: 1, execution: 2, route: 0, reach: 1, check: 1 } },
  { id: 'parliament', name: '국회 통제 우선', note: '본예산 경로와 순증 여부를 무겁게 본다', weights: { capital: 1, netNew: 2, execution: 1, route: 3, reach: 0, check: 1 } },
  { id: 'assets', name: '자산형성 우선', note: '출자·R&D·기여금을 현금 지급보다 앞세운다', weights: { capital: 3, netNew: 2, execution: 1, route: 0, reach: 1, check: 0 } },
];

const CAPITAL: Partial<Record<Program['spendType'], number>> = {
  equity: 1, rnd: 1, infra: 1, 'matched-saving': 1, service: 0.5, grant: 0.5, cash: 0,
};
const NET_NEW: Partial<Record<Program['nature'], number>> = {
  new: 1, expanded: 1, 'tax-converted': 0.5, transferred: 0,
};
const EXEC_LOW = 1.5;
const EXEC_HIGH = 10;

function executionLens(p: Program): number | undefined {
  if (p.nature === 'unknown') return undefined;
  if (p.amount26Eok === null || p.amount26Eok <= 0) return 0.5; // 신규
  const r = p.amount27Eok / p.amount26Eok;
  if (r <= EXEC_LOW) return 1;
  if (r >= EXEC_HIGH) return 0;
  return 1 - (Math.log(r) - Math.log(EXEC_LOW)) / (Math.log(EXEC_HIGH) - Math.log(EXEC_LOW));
}

export interface LensContext { maxBeneficiaries: number }

export function lensValues(p: Program, ctx: LensContext): Partial<Record<LensKey, number>> {
  const v: Partial<Record<LensKey, number>> = {};
  const c = CAPITAL[p.spendType];
  if (c !== undefined) v.capital = c;
  const n = NET_NEW[p.nature];
  if (n !== undefined) v.netNew = n;
  const e = executionLens(p);
  if (e !== undefined) v.execution = e;
  if (p.route === 'budget') v.route = 1;
  else if (p.route === 'fund' || p.route === 'special-account') v.route = 0;
  if (p.beneficiaries && ctx.maxBeneficiaries > 1) {
    v.reach = Math.log(1 + p.beneficiaries.value) / Math.log(1 + ctx.maxBeneficiaries);
  }
  if (p.unit) v.check = p.unit.matches ? 1 : 0;
  return v;
}

export function scoreProgram(p: Program, w: Weights, ctx: LensContext): number | undefined {
  if (p.isRemainder) return undefined;
  const v = lensValues(p, ctx);
  let num = 0;
  let den = 0;
  for (const k of LENS_KEYS) {
    const x = v[k];
    if (x === undefined || w[k] === 0) continue;
    num += w[k] * x;
    den += w[k];
  }
  return den === 0 ? undefined : num / den;
}

export interface RankedProgram {
  program: Program;
  score?: number;
  lenses: Partial<Record<LensKey, number>>;
}

export function rankPrograms(programs: readonly Program[], w: Weights): RankedProgram[] {
  assertSameGov(programs);
  const ctx: LensContext = {
    maxBeneficiaries: Math.max(1, ...programs.map((p) => p.beneficiaries?.value ?? 0)),
  };
  const allZero = LENS_KEYS.every((k) => w[k] === 0);
  const ranked = programs.map((p) => ({
    program: p,
    score: allZero ? undefined : scoreProgram(p, w, ctx),
    lenses: lensValues(p, ctx),
  }));
  return ranked.sort((a, b) => {
    if (a.score !== undefined && b.score !== undefined && a.score !== b.score) return b.score - a.score;
    if (a.score !== undefined && b.score === undefined) return -1;
    if (a.score === undefined && b.score !== undefined) return 1;
    return b.program.amount27Eok - a.program.amount27Eok;
  });
}
```

- [x] **Step 4: 통과 확인** — `npx jest src/lib/programs -v` 전부 PASS, `npx tsc --noEmit`.

- [x] **Step 5: 커밋**

```bash
git add src/lib/programs/scoring.ts src/lib/programs/__tests__/scoring.test.ts
git commit -m "feat(programs): 렌즈 6개·가중 점수·순위, 프리셋 3개"
```

---

### Task 4: 재배분

**Files:**
- Create: `src/lib/programs/reallocation.ts`
- Test: `src/lib/programs/__tests__/reallocation.test.ts`

**Interfaces:**
- Consumes: `RankedProgram`
- Produces:
  - `ReallocationInput = { bottomN: number; cutRate: number /*0~1*/; split: { top: number; grant: number; debt: number; reserve: number } /*합 1*/ }`
  - `GRANT_GAP_CAP_EOK = 210_000` (정부 추산 교부금 차액 21조)
  - `reallocate(ranked: RankedProgram[], input): ReallocationResult` — `{ freedEok, cuts: {id, fromEok, toEok}[], adds: {id, fromEok, toEok}[], grantEok, debtEok, reserveEok, totalBeforeEok, totalAfterEok, byAccount: Record<FundAccount, {before, after}> }`
  - 불변식: `totalAfterEok + grantEok + debtEok + reserveEok === totalBeforeEok` (억 단위 반올림 후 0 오차)

- [x] **Step 1: 실패하는 테스트**

```ts
// src/lib/programs/__tests__/reallocation.test.ts
import { rankPrograms, ZERO_WEIGHTS } from '../scoring';
import { reallocate, GRANT_GAP_CAP_EOK } from '../reallocation';
import { ALL_PROGRAMS } from '../index';

const ranked = () => rankPrograms(ALL_PROGRAMS.filter((p) => p.gov.code === '00'), ZERO_WEIGHTS);

describe('재배분', () => {
  it('삭감 0이면 아무것도 바뀌지 않는다', () => {
    const r = reallocate(ranked(), { bottomN: 5, cutRate: 0, split: { top: 1, grant: 0, debt: 0, reserve: 0 } });
    expect(r.freedEok).toBe(0);
    expect(r.totalAfterEok).toBe(454_000);
  });

  it('총액 불변식: 사업 합계 + 교부금 보전 + 국채 상환 + 적립 = 45.4조 (무작위 20회)', () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 20; i++) {
      const a = rnd(), b = rnd(), c = rnd(), d = rnd();
      const s = a + b + c + d;
      const r = reallocate(ranked(), {
        bottomN: 1 + Math.floor(rnd() * 10),
        cutRate: rnd(),
        split: { top: a / s, grant: b / s, debt: c / s, reserve: d / s },
      });
      expect(Math.round(r.totalAfterEok + r.grantEok + r.debtEok + r.reserveEok)).toBe(454_000);
    }
  });

  it('잔여 행은 삭감 대상이 아니다', () => {
    const r = reallocate(ranked(), { bottomN: 10, cutRate: 1, split: { top: 0, grant: 0, debt: 0, reserve: 1 } });
    expect(r.cuts.some((c) => c.id.endsWith('-remainder'))).toBe(false);
  });

  it('교부금 보전은 21조를 넘지 않고 초과분은 적립으로 간다', () => {
    const r = reallocate(ranked(), { bottomN: 10, cutRate: 1, split: { top: 0, grant: 1, debt: 0, reserve: 0 } });
    expect(r.grantEok).toBeLessThanOrEqual(GRANT_GAP_CAP_EOK);
    expect(r.reserveEok).toBeCloseTo(Math.max(0, r.freedEok - GRANT_GAP_CAP_EOK), 6);
  });

  it('상위 배분은 상위 N건에 금액 비례로 간다', () => {
    const rk = ranked();
    const r = reallocate(rk, { bottomN: 3, cutRate: 0.5, split: { top: 1, grant: 0, debt: 0, reserve: 0 } });
    const tops = r.adds.map((a) => a.id);
    expect(tops.length).toBe(3);
    const ratio = r.adds.map((a) => (a.toEok - a.fromEok) / a.fromEok);
    expect(Math.max(...ratio) - Math.min(...ratio)).toBeLessThan(1e-9);
  });
});
```

- [x] **Step 2: 실패 확인** — `Cannot find module '../reallocation'`

- [x] **Step 3: 구현**

```ts
// src/lib/programs/reallocation.ts
import type { FundAccount } from './types';
import type { RankedProgram } from './scoring';

/** 정부 추산 교부금 차액(기존 연동 대비) 약 21조원 — 기획예산처 2026~2030 국가재정운용계획 */
export const GRANT_GAP_CAP_EOK = 210_000;

export interface ReallocationInput {
  bottomN: number;
  /** 0~1 */
  cutRate: number;
  /** 합이 1. 상위 사업 / 교부금 차액 보전 / 국채 상환 / 적립 */
  split: { top: number; grant: number; debt: number; reserve: number };
}

export interface Move { id: string; fromEok: number; toEok: number }

export interface ReallocationResult {
  freedEok: number;
  cuts: Move[];
  adds: Move[];
  grantEok: number;
  debtEok: number;
  reserveEok: number;
  totalBeforeEok: number;
  totalAfterEok: number;
  byAccount: Partial<Record<FundAccount, { before: number; after: number }>>;
}

export function reallocate(ranked: RankedProgram[], input: ReallocationInput): ReallocationResult {
  const scorable = ranked.filter((r) => !r.program.isRemainder);
  const n = Math.max(0, Math.min(input.bottomN, Math.floor(scorable.length / 2)));
  const bottom = scorable.slice(scorable.length - n);
  const top = scorable.slice(0, n);
  const rate = Math.min(1, Math.max(0, input.cutRate));

  const cuts: Move[] = bottom.map((r) => ({
    id: r.program.id,
    fromEok: r.program.amount27Eok,
    toEok: r.program.amount27Eok * (1 - rate),
  }));
  const freedEok = cuts.reduce((s, c) => s + (c.fromEok - c.toEok), 0);

  const toTop = freedEok * input.split.top;
  let grantEok = freedEok * input.split.grant;
  const debtEok = freedEok * input.split.debt;
  let reserveEok = freedEok * input.split.reserve;
  if (grantEok > GRANT_GAP_CAP_EOK) {
    reserveEok += grantEok - GRANT_GAP_CAP_EOK;
    grantEok = GRANT_GAP_CAP_EOK;
  }

  const topBase = top.reduce((s, r) => s + r.program.amount27Eok, 0);
  const adds: Move[] = top.map((r) => ({
    id: r.program.id,
    fromEok: r.program.amount27Eok,
    toEok: r.program.amount27Eok + (topBase > 0 ? (toTop * r.program.amount27Eok) / topBase : 0),
  }));

  const after = new Map<string, number>();
  for (const r of ranked) after.set(r.program.id, r.program.amount27Eok);
  for (const c of cuts) after.set(c.id, c.toEok);
  for (const a of adds) after.set(a.id, a.toEok);

  const byAccount: ReallocationResult['byAccount'] = {};
  for (const r of ranked) {
    const acc = r.program.account;
    const cur = byAccount[acc] ?? { before: 0, after: 0 };
    cur.before += r.program.amount27Eok;
    cur.after += after.get(r.program.id) ?? 0;
    byAccount[acc] = cur;
  }

  const totalBeforeEok = ranked.reduce((s, r) => s + r.program.amount27Eok, 0);
  const totalAfterEok = [...after.values()].reduce((s, v) => s + v, 0);
  return { freedEok, cuts, adds, grantEok, debtEok, reserveEok, totalBeforeEok, totalAfterEok, byAccount };
}
```

- [x] **Step 4: 통과 확인** — `npx jest src/lib/programs -v` 전부 PASS.

- [x] **Step 5: 커밋**

```bash
git add src/lib/programs/reallocation.ts src/lib/programs/__tests__/reallocation.test.ts
git commit -m "feat(programs): 재배분 — 하위 삭감분을 상위·교부금 보전·국채·적립으로, 총액 불변"
```

---

### Task 5: 분쟁 하나에 계산기 여러 개 (`calculator` → `calculators`)

**Files:**
- Modify: `src/lib/disputes/types.ts` (Dispute 필드)
- Modify: `src/lib/disputes/education-grant.ts:116`, `src/lib/disputes/future-fund.ts:94`
- Modify: `src/lib/disputes/__tests__/disputes.test.ts:19-23`
- Modify: `src/app/disputes/[slug]/page.tsx:42-56`

**Interfaces:**
- Produces: `Dispute.calculators?: CalculatorKey[]` (기존 `calculator?` 제거)

- [x] **Step 1: 테스트 수정 (실패하게)**

`disputes.test.ts`의 calculator 검사를 다음으로 바꾼다:

```ts
  it('calculators 키가 레지스트리 목록에 존재하고 중복이 없다', () => {
    for (const d of ALL_DISPUTES) {
      for (const k of d.calculators ?? []) expect(CALCULATOR_KEYS).toContain(k);
      expect(new Set(d.calculators ?? []).size).toBe((d.calculators ?? []).length);
    }
  });

  it('교부금·미래대응기금 분쟁에 계산기가 있다', () => {
    expect(getDispute('education-grant')?.calculators).toEqual(['grant-formula']);
    expect(getDispute('future-fund')?.calculators).toContain('fund-scenario');
  });
```

- [x] **Step 2: 실패 확인** — `npx tsc --noEmit`이 `calculators` 없음으로 실패.

- [x] **Step 3: 타입·데이터·페이지 수정**

`types.ts`:
```ts
  /** 없으면 ④ 절에 계산기를 렌더링하지 않는다. 여러 개면 순서대로 렌더링 */
  calculators?: CalculatorKey[];
```
(`calculator?: CalculatorKey;` 줄 삭제)

`education-grant.ts`: `calculator: 'grant-formula',` → `calculators: ['grant-formula'],`
`future-fund.ts`: `calculator: 'fund-scenario',` → `calculators: ['fund-scenario'],`

`page.tsx`:
```tsx
  const calculators = (dispute.calculators ?? []).map((k) => ({ key: k, Component: CALCULATORS[k] }));

  // … 「숫자로 보기」 절
      {calculators.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground">숫자로 보기</h2>
          <p className="mt-1 mb-4 text-base leading-relaxed text-muted-foreground">
            가정을 바꾸면 결과가 어떻게 움직이는지 직접 확인하세요. 판단은 독자가 합니다.
          </p>
          <div className="flex flex-col gap-10">
            {calculators.map(({ key, Component }) => (
              <Component key={key} />
            ))}
          </div>
        </section>
      )}

      {calculators.length === 0 && dispute.comparison && ( /* 기존 그대로 */ )}
```

- [x] **Step 4: 확인** — `npx tsc --noEmit`, `npx jest src/lib/disputes` PASS, `npx next build` 통과. `grep -rn "\.calculator\b" src`가 비어야 한다.

- [x] **Step 5: 커밋**

```bash
git add src/lib/disputes src/app/disputes
git commit -m "refactor(disputes): 분쟁당 계산기 여러 개 — calculator를 calculators 배열로"
```

---

### Task 6: 화면 — ProgramReview 계산기

**Files:**
- Create: `src/components/disputes/calculators/program-review/labels.ts`
- Create: `src/components/disputes/calculators/program-review/WeightPanel.tsx`
- Create: `src/components/disputes/calculators/program-review/RankingTable.tsx`
- Create: `src/components/disputes/calculators/program-review/ReallocationPanel.tsx`
- Create: `src/components/disputes/calculators/ProgramReview.tsx`
- Modify: `src/lib/disputes/types.ts` (`CALCULATOR_KEYS`에 `'program-review'`)
- Modify: `src/components/disputes/calculators/index.ts`
- Modify: `src/lib/disputes/future-fund.ts` (`calculators: ['program-review', 'fund-scenario']`)

**Interfaces:**
- Consumes: `programsOf(CENTRAL_GOV)`, `rankPrograms`, `PRESETS`, `ZERO_WEIGHTS`, `reallocate`, `FIGURE_KIND_LABEL`
- Produces: `ProgramReview: ComponentType` (props 없음 — 레지스트리 규약)

- [x] **Step 1: 라벨**

```ts
// labels.ts
import type { FundAccount, LensKey, ProgramNature, ReviewRoute, SpendType } from '@/lib/programs/types';

export const ACCOUNT_LABEL: Record<FundAccount, string> = {
  youth: '청년', growth: '성장동력', regional: '지방', education: '교육·인재', none: '본예산',
};
export const NATURE_LABEL: Record<ProgramNature, string> = {
  new: '신규', expanded: '확대', transferred: '이관', 'tax-converted': '조세지출 전환', unknown: '미공개',
};
export const SPEND_LABEL: Record<SpendType, string> = {
  cash: '현금·바우처', 'matched-saving': '기여금(자산형성)', grant: '보조·출연', equity: '출자',
  rnd: 'R&D', infra: '건설·설비', service: '인력·프로그램', unknown: '미공개',
};
export const ROUTE_LABEL: Record<ReviewRoute, string> = {
  budget: '본예산', fund: '기금', 'special-account': '특별회계', unknown: '미공개',
};
export const LENS_LABEL: Record<LensKey, { name: string; note: string }> = {
  capital: { name: '자본축적성', note: '출자·R&D·설비·기여금은 1, 보조·프로그램은 0.5, 현금 지급은 0. 정부 NEXT 원칙의 「N 자본축적」을 그대로 씀' },
  netNew: { name: '순증 여부', note: '신규·확대는 1, 조세지출 전환은 0.5, 기존 급여의 재원 이관은 0. 이관은 새 돈이 아니다' },
  execution: { name: '집행 위험', note: '전년 대비 1.5배 이하면 1, 10배 이상이면 0, 신규는 0.5. 집행 기반 없는 급증은 위험' },
  route: { name: '국회 심의 경로', note: '본예산 1, 기금 0. 기금 사업은 30% 특례와 세입 보전 전출의 대상' },
  reach: { name: '수혜 범위', note: '문서에 수혜 인원이 있는 사업만. 로그 정규화' },
  check: { name: '검산 일치', note: '단가×수량이 문서에 있고 금액과 ±1% 안이면 1, 어긋나면 0' },
};
```

- [x] **Step 2: WeightPanel**

```tsx
// WeightPanel.tsx
'use client';

import { LENS_KEYS, type Weights } from '@/lib/programs/types';
import { PRESETS } from '@/lib/programs/scoring';
import { LENS_LABEL } from './labels';

export function WeightPanel({ weights, onChange }: { weights: Weights; onChange: (w: Weights) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.weights)}
            className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-base text-foreground hover:bg-muted"
            title={p.note}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        프리셋은 출발점입니다. 아래 가중치는 예시이며 바꿀 수 있습니다. 「정부 기준」은 NEXT 원칙 중
        데이터로 표현되는 N(자본축적)·X(탄력 집행)만 반영한 것입니다.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LENS_KEYS.map((k) => (
          <div key={k} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-medium text-foreground">{LENS_LABEL[k].name}</span>
              <span className="text-base font-bold tabular-nums text-foreground">{weights[k]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={weights[k]}
              onChange={(e) => onChange({ ...weights, [k]: Number(e.target.value) as Weights[typeof k] })}
              className="mt-2 w-full accent-blue-600"
              aria-label={LENS_LABEL[k].name}
              aria-valuetext={String(weights[k])}
            />
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{LENS_LABEL[k].note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 3: RankingTable** — 행 클릭으로 펼침(`useState<string | null>`), 펼치면 렌즈 값(소수 2자리)과 `evidence` 인용문·출처 목록. 잔여 행은 `text-muted-foreground`이고 점수 칸 「—」. 열: 순위 / 사업 / 계정 / '27 금액(억원, `toLocaleString('ko-KR')`) / 성격 / 지출 유형 / 점수(소수 2자리). 테이블은 `overflow-x-auto` div로 감싼다. 약 120줄.

```tsx
// RankingTable.tsx — 골격
'use client';

import { useState } from 'react';
import type { RankedProgram } from '@/lib/programs/scoring';
import { LENS_KEYS } from '@/lib/programs/types';
import { ACCOUNT_LABEL, LENS_LABEL, NATURE_LABEL, SPEND_LABEL } from './labels';

export function RankingTable({ ranked }: { ranked: RankedProgram[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-base">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2">#</th><th className="px-3 py-2">사업</th><th className="px-3 py-2">계정</th>
            <th className="px-3 py-2 text-right">’27 (억원)</th><th className="px-3 py-2">성격</th>
            <th className="px-3 py-2">지출 유형</th><th className="px-3 py-2 text-right">점수</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => {
            const p = r.program;
            const isOpen = open === p.id;
            return (
              <FragmentRow key={p.id} /* … 행 + 펼침 행 */ />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```
(실행자는 `<>`로 본 행과 펼침 행을 묶어 구현한다. 펼침 행에는 `LENS_KEYS.filter(k => r.lenses[k] !== undefined)` 목록과 `p.evidence.map(e => <li>「{e.quote}」 — {e.source}</li>)`, `p.unit?.note`, `p.sources`.)

- [x] **Step 4: ReallocationPanel** — 입력: 하위 N(1~10), 삭감률(0~100%), 배분 비율 4개 슬라이더(각 0~100, 합으로 정규화해 표시). 결과: `Figure` 3개(풀린 금액 / 사업 합계 후 / 교부금 보전·국채·적립 합) + 계정별 before/after 막대(단순 `div` 폭 %, 인라인 스타일 금지이므로 Tailwind `w-[…]` 대신 `style` 없이 — **CSS 변수 클래스도 인라인이므로 금지**; 폭은 `aria-valuenow`와 숫자 텍스트로 표현하고 막대는 10단계 폭 클래스 `w-[10%]…w-full` 중 반올림 선택). 하단에 불변식 문장 "사업 합계 + 교부금 보전 + 국채 상환 + 적립 = 45조 4,000억원"을 실제 계산값으로 출력.

- [x] **Step 5: ProgramReview 조합**

```tsx
// ProgramReview.tsx
'use client';

import { useMemo, useState } from 'react';
import { programsOf } from '@/lib/programs';
import { CENTRAL_GOV } from '@/lib/programs/gov';
import { rankPrograms, PRESETS } from '@/lib/programs/scoring';
import { reallocate, type ReallocationInput } from '@/lib/programs/reallocation';
import type { Weights } from '@/lib/programs/types';
import { WeightPanel } from './program-review/WeightPanel';
import { RankingTable } from './program-review/RankingTable';
import { ReallocationPanel } from './program-review/ReallocationPanel';

const DEFAULT_INPUT: ReallocationInput = { bottomN: 3, cutRate: 0, split: { top: 0, grant: 0.5, debt: 0.25, reserve: 0.25 } };

export function ProgramReview() {
  const [weights, setWeights] = useState<Weights>(PRESETS[0].weights);
  const [input, setInput] = useState<ReallocationInput>(DEFAULT_INPUT);
  const programs = useMemo(() => programsOf(CENTRAL_GOV), []);
  const ranked = useMemo(() => rankPrograms(programs, weights), [programs, weights]);
  const result = useMemo(() => reallocate(ranked, input), [ranked, input]);
  const disclosed = programs.filter((p) => !p.isRemainder).reduce((s, p) => s + p.amount27Eok, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">사업 검토 — 기준을 정하면 순위가 바뀝니다</h3>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          미래대응기금 4대 계정 첫해 사업지출 45조 4,000억원 가운데 정부가 주요사업으로 공개한 것은{' '}
          {(disclosed / 10000).toFixed(1)}조원입니다. 나머지는 계정별 「기타」로 두고 총액에만 넣었습니다.
        </p>
      </div>
      <WeightPanel weights={weights} onChange={setWeights} />
      <RankingTable ranked={ranked} />
      <ReallocationPanel input={input} onChange={setInput} result={result} />
      <p className="rounded-md border border-border bg-muted/20 p-3 text-base leading-relaxed text-muted-foreground">
        이 도구는 효과를 추정하지 않습니다. 사업의 성격·규모·경로·근거라는 확인 가능한 사실을 독자의
        기준으로 정렬할 뿐입니다. 순위가 낮다는 것은 그 기준에서 그렇다는 뜻이지 사업이 나쁘다는 뜻이
        아닙니다.
      </p>
      <p className="font-mono text-sm text-muted-foreground">
        출처 — 기획예산처 2027년 예산안 홍보자료 7쪽 「미래대응기금 주요사업」 · 100대 신규사업 ·
        2027년 청년정책 주요내용 개요도. 점수·재배분은 화면의 계산식대로 산출한 [역산] 값입니다.
      </p>
    </div>
  );
}
```

레지스트리·키·데이터:
- `types.ts`: `export const CALCULATOR_KEYS = ['grant-formula', 'fund-scenario', 'program-review'] as const;`
- `index.ts`: `'program-review': ProgramReview,`
- `future-fund.ts`: `calculators: ['program-review', 'fund-scenario'],`

- [x] **Step 6: 확인**

Run: `npx tsc --noEmit && npx eslint src/components/disputes src/lib/programs src/lib/disputes && npx jest && npx next build`
Expected: 모두 통과. 각 컴포넌트 파일 300줄 이하(`wc -l`).

- [x] **Step 7: 커밋**

```bash
git add src/components/disputes/calculators src/lib/disputes/types.ts src/lib/disputes/future-fund.ts
git commit -m "feat(disputes): 사업 검토 계산기 — 가중치·순위·재배분, 미래대응기금 페이지에 추가"
```

---

### Task 7: 브라우저 검증과 마무리

**Files:** 없음(검증). 필요 시 앞 태스크 파일 수정.

- [x] **Step 1**: dev 서버(`preview_start dev`)에서 `/disputes/future-fund` 열기. 확인:
  - 「숫자로 보기」에 사업 검토 → 기금 시나리오 순으로 계산기 2개
  - 「정부 기준」 프리셋에서 순위표 35행, 잔여 4행이 맨 뒤·점수 「—」
  - 삭감률 0에서 "사업 합계 + … = 454,000억" 문장의 합이 정확히 454,000
  - 삭감률 50%·하위 3건에서 합계 여전히 454,000, 계정별 막대 변화
  - 행 펼침에 인용문·출처 표시
  - 콘솔 오류 0, 모바일(375px)에서 표가 가로 스크롤
- [x] **Step 2**: `/disputes/education-grant`, `/disputes/pension` 회귀 — 이전과 같은 화면
- [x] **Step 3**: 계획 문서의 체크박스 갱신, 설계문서 §8 열린 질문에 결과 기록(창업사업화 금액 출처, 통합지원금 사무이관 분류, 청년 잔여 규모)
- [x] **Step 4**: 커밋 `docs(programs): 1단계 검증 결과와 열린 질문 정리`. 푸시·배포는 사용자에게 묻는다.
