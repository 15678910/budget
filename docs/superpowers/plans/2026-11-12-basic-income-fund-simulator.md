# AI 기본소득 기금 시뮬레이터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대안 세입(로봇·데이터·탄소), 유산, 초과세수, 공유 자산으로 1인당 기본소득을 지급할 때 기금이 지속가능한지를 해마다 계산하는 순수 함수 엔진과, 그 위의 '하나의 기금 흐름' 화면을 만든다.

**Architecture:** `src/lib/basic-income/`에 해마다 한 칸씩 도는 `simulate()`를 두고, 재원·규칙은 작은 순수 함수로 꽂는다. 탐색 함수(`maxSustainableNow`, `firstPassingYear`)와 미래대응기금 시나리오는 같은 엔진을 여러 번 돌린다. 화면은 `src/components/simulator/basic-income/`에 두고, `useMemo`로 엔진을 부른다.

**Tech Stack:** TypeScript, Next.js 16(App Router), React 19, recharts 3, papaparse(CSV), `window.print()`(PDF), jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-11-12-basic-income-fund-simulator-design.md`

## Global Constraints
- 금액 단위는 2027년 불변가격 실질 **조 원**(number)이다. 1인당 금액만 원(정수, `Math.round`)으로 쓴다. 수익률·세율·비율은 0~1 소수다.
- 결정론적 계산만 한다. Gemini 호출과 `Math.random`을 쓰지 않는다.
- 파일은 300줄 이하(500줄 초과 금지)로 쓴다. 타입은 같은 폴더의 `types.ts`에 둔다. import는 `@/`로 한다. `console.log`·`any`·인라인 `style`을 쓰지 않는다.
- PDF는 `window.print()`와 print CSS로 만든다. `html2canvas`와 jspdf는 쓰지 않는다(budget `CLAUDE.md`: Tailwind v4 lab() 문제, jspdf는 한글 글꼴이 없다).
- K-ETS 유상할당 수입은 어떤 입력에도 넣지 않는다. 화면에 "기후대응기금으로 가므로 제외"라고 적는다.
- 기본값은 `SourcedValue`(`kind: 'source' | 'derived' | 'assumption'`)로 둔다. 사실 값은 원문을 확인한 것만 넣는다. 확인 전이면 0에 `note: '출처 확인 전'`을 단다. 쓰지 말 것: 노동소득분배율 2025년 66.8%, 국회미래연구원 'AI 사회보장세', 조세연 2018 로봇세 보고서, 2017년 한국 투자세액공제 축소.
- 부동소수 비교는 `EPS = 1e-9`로 한다.
- **커밋하지 않는다.** 각 Task 끝은 시험 통과 확인으로 끝난다. 커밋·배포는 마지막에 사용자가 승인한 뒤에 한다. 미추적 파일(`docs/blog/`, `docs/briefs/`, `public/`의 hwpx·txt 4개)은 건드리지 않는다.
- 시험 명령: `npx jest src/lib/basic-income --silent 2>&1 | tail -n 20`

## Review Focus
1. 인출률이 실질 수익률보다 크면 첫해부터 원금이 잠식된다. '원금 잠식'으로 실패해야 하고, 지속가능으로 나오면 안 된다. → Task 4 `fails on principal when withdrawal rate exceeds return`
2. 탄소중립 연도가 기준 연도와 같거나 더 이르면 0으로 나누지 않고, 탄소세가 0이어야 한다. → Task 2 `carbon is zero when netZeroYear <= baseYear`
3. 지급용 세입이 지급액보다 크면 남는 몫이 기금 원금에 들어가야 한다. 사라지면 안 된다. → Task 4 `excess pay revenue is saved into fund and principal`
4. 입력이 비정상이면(음수 인구 변화율 −100% 이하, 기간 0, NaN) 화면이 깨지지 않아야 한다. 엔진은 입력을 다듬어서 받는다. → Task 4 `sanitizeInput clamps invalid values`
5. 목표 액수가 기간 안에 끝내 통과하지 못하면 `firstPassingYear`가 무한히 돌지 않고 `null`을 돌려야 한다. → Task 5 `firstPassingYear returns null when never passing`

---

### Task 1: 타입과 지출 규칙 (④)

**Files:**
- Create: `src/lib/basic-income/types.ts`
- Create: `src/lib/basic-income/spending-rule.ts`
- Test: `src/lib/basic-income/__tests__/spending-rule.test.ts`

**Interfaces:**
- Produces (`types.ts`, 이후 모든 Task가 쓴다):
```ts
export type ValueKind = 'source' | 'derived' | 'assumption';
export interface SourcedValue {
  label: string; value: number; unit: string; kind: ValueKind;
  source?: string; url?: string; note?: string; columnRef?: number; // 칼럼 참고 자료 번호
}
export type FlowMode = 'pay' | 'save';
export interface RobotTaxInput { base: number; rate: number; annualDecline: number; mode: FlowMode }
export interface DataTaxInput { base: number; rate: number; annualGrowth: number; mode: FlowMode }
export interface CarbonTaxInput { emissionsMt: number; pricePerTonWon: number; netZeroYear: number; mode: FlowMode }
export interface AltRevenueInput { robot: RobotTaxInput; data: DataTaxInput; carbon: CarbonTaxInput }
export interface BequestInput { eligibleEstate: number; uptake: number; shareToFund: number; effectiveTaxRate: number }
export interface SurplusInput { annualExcess: number; saveRatio: number }
export interface SharedAsset { id: string; label: string; stake: number; yieldRate: number; mode: FlowMode; candidate: boolean }
export interface SimInput {
  baseYear: number; payStartYear: number; horizonYears: number;
  monthlyPerPerson: number;            // 원
  population0: number; populationGrowth: number;
  realReturn: number; withdrawalRate: number;
  initialFund: number;                 // 조 원
  socialInsuranceTopUp: { enabled: boolean; annual: number }; // ③, 조 원
  alt: AltRevenueInput; bequest: BequestInput; surplus: SurplusInput; sharedAssets: SharedAsset[];
}
export interface RevenueBreakdown { robot: number; data: number; carbon: number; bequest: number; surplus: number; shared: number }
export interface YearRow {
  year: number; paying: boolean; population: number; need: number;
  payRevenue: number; saveInflow: number; withdrawal: number; shortfall: number;
  fundEnd: number; principal: number; revenues: RevenueBreakdown;
}
export type FailReason = 'shortfall' | 'principal';
export interface Verdict { sustainable: boolean; firstFailYear: number | null; reason: FailReason | null }
export interface SimResult { rows: YearRow[]; verdict: Verdict }
```
- Produces (`spending-rule.ts`): `withdrawalCap(fundPrev: number, rate: number): number`, `perpetualFund(annualNet: number, rate: number): number`, `EPS = 1e-9`.

- [ ] **Step 1: Write the failing test**
```ts
describe('spending-rule', () => {
  it('perpetualFund: 연 51.4조를 3%·4%로', () => {
    expect(perpetualFund(51.4, 0.03)).toBeCloseTo(1713.33, 2);
    expect(perpetualFund(51.4, 0.04)).toBeCloseTo(1285, 6);
  });
  it('perpetualFund: 순필요액이 0 이하면 0', () => expect(perpetualFund(-3, 0.03)).toBe(0));
  it('perpetualFund: 인출률 0이면 Infinity', () => expect(perpetualFund(1, 0)).toBe(Infinity));
  it('withdrawalCap: 음수 기금은 0', () => {
    expect(withdrawalCap(162.3, 0.03)).toBeCloseTo(4.869, 6);
    expect(withdrawalCap(-5, 0.03)).toBe(0);
  });
});
```
- [ ] **Step 2: Run it and see it fail** — Run: 시험 명령. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `types.ts`(위 그대로)와 `spending-rule.ts`.
- [ ] **Step 4: Run tests** — Expected: PASS.

### Task 2: 대안 세입 (⑥)

**Files:**
- Create: `src/lib/basic-income/alt-revenue.ts`
- Test: `src/lib/basic-income/__tests__/alt-revenue.test.ts`

**Interfaces:**
- Consumes: `AltRevenueInput` 등 (Task 1).
- Produces: `robotTax(i: RobotTaxInput, t: number): number`, `dataTax(i: DataTaxInput, t: number): number`, `carbonTax(i: CarbonTaxInput, year: number, baseYear: number): number`. 여기서 t는 `year − baseYear`(≥ 0)다.
  - 로봇세 = `base × rate × (1 − annualDecline)^t`
  - 데이터세 = `base × rate × (1 + annualGrowth)^t`
  - 탄소세 = `emissionsMt × pricePerTonWon / 1e6 × max(0, (netZeroYear − year) / (netZeroYear − baseYear))`이다. `netZeroYear ≤ baseYear`이면 0.

- [ ] **Step 1: Write the failing test**
```ts
it('robotTax 감소', () => {
  const r = { base: 100, rate: 0.01, annualDecline: 0.1, mode: 'save' as const };
  expect(robotTax(r, 0)).toBeCloseTo(1, 9); expect(robotTax(r, 1)).toBeCloseTo(0.9, 9);
});
it('dataTax 3%', () => expect(dataTax({ base: 10, rate: 0.03, annualGrowth: 0, mode: 'pay' }, 5)).toBeCloseTo(0.3, 9));
it('carbonTax 직선 감소', () => {
  const c = { emissionsMt: 600, pricePerTonWon: 50_000, netZeroYear: 2050, mode: 'save' as const };
  expect(carbonTax(c, 2027, 2027)).toBeCloseTo(30, 9);
  expect(carbonTax(c, 2039, 2027)).toBeCloseTo(14.347826, 5);
  expect(carbonTax(c, 2050, 2027)).toBe(0);
  expect(carbonTax(c, 2060, 2027)).toBe(0);
});
it('carbon is zero when netZeroYear <= baseYear', () =>
  expect(carbonTax({ emissionsMt: 600, pricePerTonWon: 50_000, netZeroYear: 2027, mode: 'save' }, 2027, 2027)).toBe(0));
```
- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** `alt-revenue.ts`.
- [ ] **Step 4: Run tests** — PASS.

### Task 3: 유산·초과세수·공유 자산·아동 계좌 (⑤ ① ⑥b ②)

**Files:**
- Create: `src/lib/basic-income/bequest.ts`, `surplus-tax.ts`, `shared-assets.ts`, `child-account.ts`
- Test: `src/lib/basic-income/__tests__/inflows.test.ts`

**Interfaces:**
- Produces:
  - `bequestFlow(i: BequestInput): { toFund: number; generalAccountLoss: number }`. `toFund = eligibleEstate × uptake × shareToFund`, `generalAccountLoss = eligibleEstate × uptake × effectiveTaxRate`.
  - `surplusToFund(i: SurplusInput): number`는 `max(0, annualExcess) × saveRatio`다. 기준선 6.2%는 화면 설명 문구로만 쓴다.
  - `sharedAssetFlows(assets: SharedAsset[]): { pay: number; save: number }`. 각 자산은 `stake × yieldRate`이고 mode에 따라 나눈다.
  - `childAnnualContribution(targetWon: number, rate: number, years: number): number`(원, 반올림). 연말 납입 적립식 `target × r / ((1+r)^n − 1)`이고, `r = 0`이면 `target / n`이다.
  - `childScenario(i: { births: number; targetWon: number; rate: number; years: number; fund: number; withdrawalRate: number }): { perChildAnnualWon: number; annualCostSteady: number; coveredShare: number }`. `annualCostSteady = births × perChild × years / 1e12`(조 원, 정상 상태는 years개 코호트가 동시에 있다), `coveredShare = min(1, fund × withdrawalRate / annualCostSteady)`.

- [ ] **Step 1: Write the failing test**
```ts
it('bequestFlow', () => {
  const b = bequestFlow({ eligibleEstate: 10, uptake: 0.2, shareToFund: 0.3, effectiveTaxRate: 0.408 });
  expect(b.toFund).toBeCloseTo(0.6, 9); expect(b.generalAccountLoss).toBeCloseTo(0.816, 9);
});
it('surplusToFund는 음수 초과세수를 0으로', () => {
  expect(surplusToFund({ annualExcess: 5, saveRatio: 0.5 })).toBeCloseTo(2.5, 9);
  expect(surplusToFund({ annualExcess: -3, saveRatio: 0.5 })).toBe(0);
});
it('sharedAssetFlows는 mode로 나눈다', () => {
  const f = sharedAssetFlows([
    { id: 'a', label: 'a', stake: 100, yieldRate: 0.05, mode: 'save', candidate: false },
    { id: 'b', label: 'b', stake: 10, yieldRate: 0.1, mode: 'pay', candidate: true },
  ]);
  expect(f.save).toBeCloseTo(5, 9); expect(f.pay).toBeCloseTo(1, 9);
});
it('아동 1억 원·6.6%·18년', () => expect(childAnnualContribution(1e8, 0.066, 18)).toBe(3_056_146));
it('수익률 0이면 균등 분할', () => expect(childAnnualContribution(1.8e7, 0, 18)).toBe(1_000_000));
it('childScenario', () => {
  const c = childScenario({ births: 250_000, targetWon: 1e8, rate: 0.066, years: 18, fund: 104.4, withdrawalRate: 0.03 });
  expect(c.annualCostSteady).toBeCloseTo(13.752657, 5); expect(c.coveredShare).toBeCloseTo(0.22774, 4);
});
```
- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** 네 파일.
- [ ] **Step 4: Run tests** — PASS.

### Task 4: 엔진과 판정 (⑦, ③ 포함)

**Files:**
- Create: `src/lib/basic-income/engine.ts`
- Test: `src/lib/basic-income/__tests__/engine.test.ts`

**Interfaces:**
- Consumes: Task 1~3 전부.
- Produces: `sanitizeInput(i: SimInput): SimInput`, `simulate(i: SimInput): SimResult`, `perpetualTarget(i: SimInput): { target: number; progress: number }`.

엔진은 spec의 '엔진' 절을 그대로 따른다. 결정 사항은 다음과 같다.
- 연도 범위는 `baseYear … payStartYear + horizonYears − 1`이다. `paying = year ≥ payStartYear`이고, `paying`이 아니면 `need = 0`이다.
- `population = population0 × (1 + populationGrowth)^(year − baseYear)`, `need = monthlyPerPerson × 12 × population / 1e12`(+ ③ `enabled`면 `annual`)이다.
- 세입은 `year − baseYear`로 계산한다(기다리는 해에도 감소·증가가 진행된다). 유산·초과세수는 항상 save다. 로봇·데이터·탄소·공유 자산은 mode를 따른다.
- 한 해 계산: `W = withdrawalCap(F_prev, withdrawalRate)`, `fromRev = min(need, payRev)`, `withdrawal = min(W, need − fromRev)`, `shortfall = need − fromRev − withdrawal`, `saveInflow = saveRev + (payRev − fromRev)`, `F = F_prev × (1 + realReturn) − withdrawal + saveInflow`, `P = P_prev + saveInflow`. 시작값은 `F = P = initialFund`다.
- 판정은 `paying`인 해만 본다. `shortfall > EPS`이면 'shortfall', `F < P − EPS`이면 'principal'이다. 첫 실패 해와 이유를 기록한다(같은 해에 둘 다면 'shortfall').
- `sanitizeInput`: `horizonYears`는 1~200 정수, `populationGrowth`는 −0.5 이상, 모든 비율은 0~1, 금액과 인구는 0 이상이다. NaN이면 `DEFAULT_INPUT` 값이 아니라 0(비율)·1(기간)로 둔다. `payStartYear`는 baseYear 미만이면 baseYear로 올린다. `simulate`는 첫 줄에서 이 함수를 부른다.
- `perpetualTarget`: `target = perpetualFund(need_base − 지급용 세입_base, withdrawalRate)`, `progress = target > 0 ? min(1, initialFund / target) : 1`이다.

시험용 기준 입력 `base`(`__tests__/fixtures.ts`)는 다음과 같다. baseYear·payStartYear 2027, horizon 50, monthly 100,000, population0 1,000,000, growth 0, realReturn 0.03, withdrawalRate 0.03, initialFund 0. 모든 세입과 공유 자산은 0이고 `socialInsuranceTopUp.enabled` false다.

- [ ] **Step 1: Write the failing tests**
```ts
it('기금·세입 0이면 첫해 부족으로 실패', () => {
  const v = simulate(base).verdict;
  expect(v).toEqual({ sustainable: false, firstFailYear: 2027, reason: 'shortfall' });
});
it('기금 40조·3%=3%면 연 1.2조를 영구 지급', () => {
  const r = simulate({ ...base, initialFund: 40 });
  expect(r.verdict.sustainable).toBe(true);
  expect(r.rows).toHaveLength(50);
  expect(r.rows[49].fundEnd).toBeCloseTo(40, 6);
});
it('fails on principal when withdrawal rate exceeds return', () => {
  const v = simulate({ ...base, initialFund: 40, realReturn: 0.02 }).verdict;
  expect(v).toEqual({ sustainable: false, firstFailYear: 2027, reason: 'principal' });
});
it('excess pay revenue is saved into fund and principal', () => {
  const r = simulate({ ...base, alt: { ...base.alt, data: { base: 100, rate: 0.02, annualGrowth: 0, mode: 'pay' } } });
  expect(r.rows[0].saveInflow).toBeCloseTo(0.8, 9);
  expect(r.rows[0].principal).toBeCloseTo(0.8, 9);
  expect(r.verdict.sustainable).toBe(true);
});
it('사회보험 보전을 켜면 필요액에 더한다', () => {
  const r = simulate({ ...base, initialFund: 40, socialInsuranceTopUp: { enabled: true, annual: 0.5 } });
  expect(r.rows[0].need).toBeCloseTo(1.7, 9); expect(r.verdict.reason).toBe('shortfall');
});
it('기다리는 해에는 지급이 없다', () => {
  const r = simulate({ ...base, payStartYear: 2029, horizonYears: 1 });
  expect(r.rows.map((x) => x.paying)).toEqual([false, false, true]);
  expect(r.rows[0].need).toBe(0);
});
it('인출률 0이면 인출하지 않는다', () => {
  const r = simulate({ ...base, initialFund: 40, withdrawalRate: 0 });
  expect(r.rows[0].withdrawal).toBe(0); expect(r.verdict.reason).toBe('shortfall');
});
it('sanitizeInput clamps invalid values', () => {
  const s = sanitizeInput({ ...base, horizonYears: 0, populationGrowth: -2, withdrawalRate: Number.NaN, payStartYear: 2000 });
  expect(s.horizonYears).toBe(1); expect(s.populationGrowth).toBe(-0.5);
  expect(s.withdrawalRate).toBe(0); expect(s.payStartYear).toBe(2027);
});
it('perpetualTarget', () => {
  expect(perpetualTarget({ ...base, initialFund: 20 })).toEqual({ target: expect.closeTo(40, 6), progress: expect.closeTo(0.5, 6) });
});
```
- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** `engine.ts`와 `__tests__/fixtures.ts`.
- [ ] **Step 4: Run tests** — PASS.

### Task 5: 탐색 (지금 최대 액수, 첫 통과 연도)

**Files:**
- Create: `src/lib/basic-income/search.ts`
- Test: `src/lib/basic-income/__tests__/search.test.ts`

**Interfaces:**
- Consumes: `simulate`, fixtures `base`.
- Produces:
  - `maxSustainableNow(i: SimInput): { monthlyWon: number; annualWon: number; impossible: boolean }`. `payStartYear = baseYear`로 둔다. 월액에 대해 원 단위로 이분 탐색한다. 상한은 1,000,000원에서 시작해 통과하는 동안 두 배로 늘리고, 최대 1e9원까지 간다. 0원도 실패하면 `{0, 0, impossible: true}`다.
  - `firstPassingYear(i: SimInput): number | null`. `k = 0 … horizonYears`에 대해 `payStartYear = baseYear + k`로 `simulate`하고, 처음 통과하는 해를 돌려준다. 없으면 `null`이다.

- [ ] **Step 1: Write the failing tests**
```ts
it('기금 40조면 월 10만 원이 최대', () => {
  const m = maxSustainableNow({ ...base, initialFund: 40 });
  expect(m.monthlyWon).toBeGreaterThanOrEqual(99_999); expect(m.monthlyWon).toBeLessThanOrEqual(100_000);
  expect(m.annualWon).toBe(m.monthlyWon * 12); expect(m.impossible).toBe(false);
});
it('판정은 액수에 대해 단조', () => {
  const pass = [50_000, 90_000, 99_000, 101_000, 150_000].map((w) => simulate({ ...base, initialFund: 40, monthlyPerPerson: w }).verdict.sustainable);
  expect(pass).toEqual([true, true, true, false, false]);
});
it('보전액만으로 실패하면 impossible', () => {
  expect(maxSustainableNow({ ...base, socialInsuranceTopUp: { enabled: true, annual: 1 } }).impossible).toBe(true);
});
it('유산 연 4조 적립이면 2036년에 처음 통과', () => {
  const i = { ...base, bequest: { eligibleEstate: 40, uptake: 1, shareToFund: 0.1, effectiveTaxRate: 0 } };
  expect(firstPassingYear(i)).toBe(2036);
});
it('firstPassingYear returns null when never passing', () => expect(firstPassingYear(base)).toBeNull());
```
- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** `search.ts`.
- [ ] **Step 4: Run tests** — PASS.

### Task 6: 미래대응기금 시나리오와 예산 비교 (⑧ ⑨)

**Files:**
- Create: `src/lib/basic-income/future-fund-scenarios.ts`, `budget-compare.ts`
- Test: `src/lib/basic-income/__tests__/scenarios.test.ts`

**Interfaces:**
- Consumes: `simulate`, `maxSustainableNow`, `firstPassingYear`, `childScenario`.
- Produces:
```ts
export type ScenarioId = 'S1' | 'S2' | 'S3' | 'S4';
export interface FutureFundInput { totalFund: number; surplusFund: number; depositRate: number; consignReturn: number;
  child: { births: number; targetWon: number; rate: number; years: number } }
export interface ScenarioRow { id: ScenarioId; label: string; seed: number; nowAnnualWon: number; targetYear: number | null;
  sustainable: boolean; extraReturnToGeneral: number | null; child: ReturnType<typeof childScenario> | null;
  control: string; futureGeneration: string }
export function runFutureFundScenarios(base: SimInput, ff: FutureFundInput): ScenarioRow[];
export interface BudgetSector { id: string; label: string; amount: number; source: SourcedValue }
export function compareToBudget(annualNeed: number, sectors: BudgetSector[]): { id: string; label: string; amount: number; ratio: number }[];
```
  - 위 타입은 `types.ts`에 넣는다. `ReturnType<typeof childScenario>` 대신 `types.ts`에 `ChildScenarioResult { perChildAnnualWon; annualCostSteady; coveredShare }`를 두고, Task 3의 `childScenario`가 이 타입을 돌려준다.
  - S1·S2·S3의 seed는 `base.initialFund`, S4는 `base.initialFund + ff.surplusFund`다.
  - S2 `extraReturnToGeneral = surplusFund × (consignReturn − depositRate)`, S3 `child = childScenario({...ff.child, fund: ff.surplusFund, withdrawalRate: base.withdrawalRate})`. 나머지 시나리오는 두 값 모두 null이다.
  - `control`·`futureGeneration` 문구는 spec ⑧ 표의 '드러낼 장단점'을 그대로 쓴다. 근거는 칼럼의 '104조 원' 절과 '노르웨이' 절이다.
  - `compareToBudget`은 금액 내림차순이다. `ratio = annualNeed / amount`이고, `amount ≤ 0`이면 그 줄을 뺀다.

- [ ] **Step 1: Write the failing tests**
```ts
const ff = { totalFund: 162.3, surplusFund: 104.4, depositRate: 0.03, consignReturn: 0.05,
  child: { births: 250_000, targetWon: 1e8, rate: 0.066, years: 18 } };
it('네 시나리오, S4만 종잣돈 104.4', () => {
  const rows = runFutureFundScenarios(base, ff);
  expect(rows.map((r) => r.id)).toEqual(['S1', 'S2', 'S3', 'S4']);
  expect(rows[3].seed).toBeCloseTo(104.4, 9); expect(rows[0].seed).toBe(0);
});
it('S2 추가 수익, S3 아동 결과', () => {
  const [, s2, s3] = runFutureFundScenarios(base, ff);
  expect(s2.extraReturnToGeneral).toBeCloseTo(2.088, 9); expect(s3.child?.coveredShare).toBeCloseTo(0.22774, 4);
});
it('S4 지금 1인당: 104.4×3%/100만 명/12', () => {
  const s4 = runFutureFundScenarios(base, ff)[3];
  expect(s4.nowAnnualWon).toBeGreaterThanOrEqual(3_131_988); expect(s4.nowAnnualWon).toBeLessThanOrEqual(3_132_000);
});
it('compareToBudget 정렬과 비율', () => {
  const src = { label: 'x', value: 0, unit: '조 원', kind: 'assumption' as const };
  const r = compareToBudget(60, [{ id: 'a', label: 'a', amount: 30, source: src }, { id: 'b', label: 'b', amount: 120, source: src }, { id: 'z', label: 'z', amount: 0, source: src }]);
  expect(r.map((x) => x.id)).toEqual(['b', 'a']); expect(r[0].ratio).toBeCloseTo(0.5, 9);
});
```
- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** 두 파일.
- [ ] **Step 4: Run tests** — PASS.

### Task 7: 1차 자료 확인과 기본값 (출처)

**Files:**
- Create: `docs/superpowers/notes/2026-11-12-basic-income-sources.md` (확인 기록: 항목, 값, 원문 URL, 확인 날짜, 원문에서 찾은 문장 위치)
- Create: `src/lib/basic-income/defaults.ts`, `src/lib/basic-income/data/budget-2027.ts`, `src/lib/basic-income/index.ts`(공개 export)
- Test: `src/lib/basic-income/__tests__/defaults.test.ts`

**Interfaces:**
- Produces: `DEFAULT_INPUT: SimInput`, `DEFAULT_FUTURE_FUND: FutureFundInput`, `DEFAULT_SOURCES: Record<string, SourcedValue>`, `BUDGET_2027: BudgetSector[]`, `SHARED_ASSET_CANDIDATES: SharedAsset[]`, `EXCLUDED_REVENUES: { label: string; reason: string; source: string }[]`(K-ETS, 확인되면 주파수 경매도).

확인할 자료는 spec '구현 전에 원문으로 확인할 자료' 목록이다. 칼럼에 이미 있는 값은 칼럼 참고 자료 번호(`columnRef`)를 단다: 미래대응기금 162.3조·104.4조(`src/lib/disputes/future-fund.ts`의 출처), 3% 인출률, 노르웨이 실질 4.3%·명목 6.6%, 아동 1억 원, 유증 특례 30%, 상속세 실효율 예시 40.8%(50억 원 → 20.4억 원, 필자 계산 `derived`), 프랑스 데이터세 3%. 인구 기본값은 `POPULATION_BY_YEAR[2026]`이다. 기본 `payStartYear`는 2027, `horizonYears`는 50이다(아래 시험이 50줄을 기대한다). 정책 손잡이(세율, 선택률, 적립 비율, 로봇세 감소율)는 `assumption`으로 둔다. `monthlyPerPerson`은 100,000원(`assumption`), `baseYear`는 2027이다. 첫 화면은 S1(`initialFund: 0`)이다.

- [ ] **Step 1: 자료 확인** — WebSearch·WebFetch로 원문을 열어 값을 찾고, 기록 파일에 적는다. 찾지 못하면 "확인 못 함"이라고 적고 0으로 둔다.
- [ ] **Step 2: Write the failing test**
```ts
it('모든 기본값에 종류가 있고, source면 출처 문자열이 있다', () => {
  for (const v of Object.values(DEFAULT_SOURCES)) {
    expect(['source', 'derived', 'assumption']).toContain(v.kind);
    if (v.kind === 'source') expect((v.source ?? '').trim()).not.toBe('');
    if (v.value === 0 && v.kind !== 'assumption') expect(v.note).toBe('출처 확인 전');
  }
});
it('예산 표의 모든 항목이 source', () => BUDGET_2027.forEach((s) => expect(s.source.kind).toBe('source')));
it('K-ETS는 제외 목록에 있다', () => expect(EXCLUDED_REVENUES.some((e) => e.label.includes('K-ETS'))).toBe(true));
it('첫 화면은 S1, 월 10만 원', () => { expect(DEFAULT_INPUT.initialFund).toBe(0); expect(DEFAULT_INPUT.monthlyPerPerson).toBe(100_000); });
it('기본 입력으로 엔진이 돈다', () => expect(simulate(DEFAULT_INPUT).rows.length).toBe(50));
it('금지 수치가 없다', () => expect(JSON.stringify(DEFAULT_SOURCES)).not.toMatch(/66\.8/));
```
- [ ] **Step 3: Run, see fail.** → **Step 4: Implement** → **Step 5: Run tests** — PASS.

### Task 8: 흐름 화면 (입력·기금·판정)

**Files:**
- Create: `src/components/simulator/basic-income/types.ts`, `BasicIncomeFundSimulator.tsx`, `TargetControls.tsx`, `InflowPanel.tsx`, `FundPanel.tsx`, `OutflowPanel.tsx`, `VerdictCard.tsx`, `NumberField.tsx`
- Modify: `src/app/(ai-society)/simulator/page.tsx` (새 컴포넌트를 `SovereignFundSimulator` 위에 두고, `PAGE_SECTIONS` 앞에 `{ id: 'bi-flow', label: '기본소득 기금 흐름' }`, `{ id: 'bi-verdict', label: '지속가능 판정' }`을 넣는다)

**Interfaces:**
- Consumes: `@/lib/basic-income` index(`simulate`, `sanitizeInput`, `perpetualTarget`, `maxSustainableNow`, `firstPassingYear`, `DEFAULT_*`, `EXCLUDED_REVENUES`, `bequestFlow`).
- Produces: `'use client'` `BasicIncomeFundSimulator()`. 상태는 `useState<SimInput>(DEFAULT_INPUT)` 하나다. `useMemo`로 sanitize → simulate → 탐색 → 목표선을 계산한다. 하위 컴포넌트는 `{ input, onChange: (patch: Partial<SimInput>) => void }` 또는 결과 객체를 props로 받는다.
- 레이아웃은 spec '화면' 절의 스케치다. 각 세입 줄에는 '지급 / 적립' 선택, '1차 자료 / 필자 계산 / 가정' 배지, K-ETS 제외 한 줄을 둔다. 판정 카드는 ✓/✗, 처음 실패한 해와 이유, '지금 시작하면 연 ○원', '목표는 20○○년'(null이면 "기간 안에 없음"), A 목표선 대비 %를 보여 준다. 유산 줄 옆에는 `generalAccountLoss`를 "일반회계 상속세 감소"로 적고, "미래 세대에 남기는 유산" 설명을 단다.

- [ ] **Step 1: Implement** 컴포넌트들. 파일마다 300줄 이하다.
- [ ] **Step 2: Type check** — Run: `npx tsc --noEmit 2>&1 | tail -n 20`. Expected: 출력 없음.
- [ ] **Step 3: 화면 확인** — dev 서버(`.claude/launch.json`에 없으면 추가)로 `/simulator`를 연다. 첫 화면에 '✗'와 '지금 시작하면 연 …원'이 보이는지, 데이터세를 '적립'으로 바꾸면 결과가 바뀌는지, 콘솔 에러가 없는지 확인한다.

### Task 9: 그래프·시나리오 표·예산 비교·출처·내보내기

**Files:**
- Create: `src/components/simulator/basic-income/YearChart.tsx`, `ScenarioTable.tsx`, `BudgetCompare.tsx`, `SourceList.tsx`, `ExportButtons.tsx`
- Create: `src/lib/basic-income/export-csv.ts` (CSV 변환 순수 함수)
- Test: `src/lib/basic-income/__tests__/export-csv.test.ts`
- Modify: `BasicIncomeFundSimulator.tsx`(붙이기), `src/app/(ai-society)/simulator/page.tsx`(`bi-scenarios`·`bi-budget`·`bi-sources` 절 추가), `src/app/globals.css`(`@media print`에 `.bi-print-root` 규칙 추가. 기존 VLR 규칙은 건드리지 않는다)

**Interfaces:**
- Produces: `rowsToCsv(rows: YearRow[]): string`(papaparse `unparse`, 한글 머리글: 연도, 지급, 인구, 필요액(조), 지급용 세입(조), 적립(조), 인출(조), 부족(조), 기금(조), 원금(조)). 다운로드할 때 앞에 BOM `﻿`를 붙인다(코드 포인트로 쓰고, Write 도구의 이스케이프 변환에 주의한다).
- YearChart: recharts `ComposedChart`로 기금 F·원금 P는 선, 인출·부족은 막대로 그린다. ScenarioTable: `runFutureFundScenarios(input, DEFAULT_FUTURE_FUND)`, 열은 spec ⑧과 같다. BudgetCompare: `compareToBudget(rows[첫 지급 해].need, BUDGET_2027)`를 가로 막대로 그린다. SourceList: `DEFAULT_SOURCES`를 종류별로 묶어 링크를 단다. ExportButtons: CSV 다운로드와 `window.print()`.

- [ ] **Step 1: Write the failing test**
```ts
it('CSV 머리글과 행 수', () => {
  const csv = rowsToCsv(simulate(base).rows);
  expect(csv.split('\n')[0]).toContain('연도'); expect(csv.trim().split('\n')).toHaveLength(51);
});
```
- [ ] **Step 2: Run, see fail.** → **Step 3: Implement** → **Step 4: Run tests** — PASS.
- [ ] **Step 5: 전체 확인** — `npx jest src/lib/basic-income --silent 2>&1 | tail -n 20`(PASS), `npx tsc --noEmit 2>&1 | tail -n 20`(출력 없음), `npx next build > <스크래치 폴더>/next-build.log 2>&1; tail -n 20 <그 파일>`(성공). 브라우저에서 그래프·표·출처·CSV·인쇄 미리보기를 확인하고 스크린샷을 남긴다.
- [ ] **Step 6: 최종 리뷰와 사용자 승인** — 브랜치 전체 리뷰(code-reviewer, opus)를 받은 뒤 사용자에게 커밋 승인을 받는다. 커밋 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 단다. 배포 확인은 `gh api repos/15678910/budget/commits/<sha>/statuses --jq '.[0].state'`로 한다.
