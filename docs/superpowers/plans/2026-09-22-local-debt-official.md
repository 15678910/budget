# 지방채무 공식 데이터 반영 + 「채무 순증」 탭 구현 계획

> **상태 (2026-09-22): 완료.** 커밋 f992ee0(데이터) 9015ef9(overlay) 3b43161(배선) 9b97b71(탭) cdd9745·4fd9b61(리뷰 반영) 7a0de88(지역지도·SDG). 갱신 절차: `python scripts/fetch-lofin-debt.py && node scripts/build-local-debt.mjs`.
> 리뷰에서 추가된 것: 1개년 이력(군위군) 차트 NaN 방지, 음수 연간 변동 부호, 광역 전년比 채무를 공식 2023 결산 기준으로, 광역 상세 채무비율을 결산 기준(서울 21.53%)으로, 계산 캐시, 출처 URL lofin365, 죽은 코드 `DebtRatioCharts.tsx` 삭제.
> 미결(사용자 판단): 건전성 점수 산식이 채무 0인 152곳에 45점을 자동 부여 → 등급 분포 이동. 후속: 챗봇·AI정책진단·재정혁신 시뮬레이터 10개 파일이 아직 추정 채무 사용.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 재정건전성 대시보드의 광역·시군구 채무잔액(현재 추정치)을 지방재정365 결산 공식값으로 덮어쓰고, 연도별 「채무 순증(= 발행 − 상환)」을 광역/기초로 비교하는 탭을 추가한다.

**Architecture:** 원자료 `data/regional/local-debt/all.csv`(gitignore, 2009~2024, 매년 243 자치단체, 원 단위) → 생성 스크립트 `scripts/build-local-debt.mjs` → 생성 모듈 `src/lib/data/local-debt-official.ts`(2018~2024, 억원). 수정 금지 파일 `src/lib/data/fiscal-health-data.ts`는 **건드리지 않고**, 새 모듈 `src/lib/data/fiscal-health-official.ts`가 기존 접근 함수 결과에 공식값을 덮어쓴다(overlay). 대시보드는 새 모듈의 함수를 호출한다. 새 탭 `debtIncrease`는 `DebtIncreaseSection.tsx`.

**Tech Stack:** Next.js 16, React 19, TS strict, Tailwind v4, Jest(ts-jest). 프로젝트 규칙: `any` 금지, 인라인 스타일 금지, 클라이언트 `console.*` 금지, 컴포넌트 300줄 이하.

**Background facts (verified 2026-09-22):**
- 원자료 출처: 지방재정365 통합공시 › 항목별 현황 › 결산기준 › 부채/채무/채권 › 예산대비채무비율(지표코드 A015) 자치단체 탭. 엔드포인트 `POST https://www.lofin365.go.kr/lf/lnncGramStst/lnncIpaByatcStlCrtr/bdgCprnDbtRtSvi/retvLstBdgCprnDbtRtGov.do` (JSON body `{fyr, pfaIndcCd:'A015', byatcClsTy:'LCTSSTL21', rgnzDvCd:'02'}`). 수집 스크립트 `scripts/fetch-lofin-debt.py`, 산출물 `data/regional/local-debt/{debt_<year>.json, all.csv, _source.md}`.
- 값: `dbtRestAmt` 채무잔액(원), `lastBdgAmt` 최종예산액(원), `dbtRt` 비율(%). 통합회계(일반+공기업특별+기타특별+기금). 산정공식 (채무잔액÷최종예산액)×100.
- 이름 형식: 광역 `서울본청`·`경기본청`·`강원본청`(2024부터 강원특별자치도지만 이름은 `강원본청`)·`전북본청`·`광주본청`·`전남본청`; 기초 `서울강남구`, `경기수원시`, `충북청주시`, `전남광양시` 등 시도약칭+자치단체명.
- 사이트 데이터(`fiscal-health-data.ts`): 광역 16개 — `광주광역시`+`전라남도`가 `전남광주통합특별시`로 합쳐져 있다. 시군구 227행, `metro` 필드는 광역 전체 이름. `전남광주통합특별시` 소속 27개 중 광산구·서구·북구·동구·남구는 원자료 `광주`, 나머지 22개는 `전남`.
- 제주특별자치도의 제주시·서귀포시는 행정시(자치단체 아님)라 원자료에 없다 → 사이트 데이터의 이 2행만 추정치(`estimated`)로 남고 `[추정]` 표시.
- 2024 공식 결산: 기초 226 중 채무 있는 곳 74. 사이트 추정치는 매칭 198곳 중 135곳에서 공식 0인데 양수. (예: 화성시 추정 4,500억 vs 공식 0, 전주시 1,800 vs 4,653.)
- 기존 하드코딩 `METRO_YEARLY_DEBT_INCREASE`(`src/components/fiscal/types.ts`)는 `utils.ts:74`, `MetroDetailModal.tsx:40`, `FiscalHealthDashboard.tsx:198`에서 쓰인다(실시간 시계용 연간 증가액).

## Global Constraints
- `src/lib/data/fiscal-health-data.ts`, `standard-costs.ts`, `.env.local` 수정 금지.
- 생성 모듈은 스크립트로만 만들고 손으로 고치지 않는다(파일 머리에 "자동생성, 수동 편집 금지").
- 모든 표에 출처 문구: "지방재정365 통합공시 예산대비채무비율(결산), 통합회계 채무잔액. 순증은 발행액이 아니라 잔액 증감(발행 − 상환)".
- 커밋 트레일러 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 푸시·배포는 사용자 지시 시.

---

### Task 1: 생성 스크립트와 공식 데이터 모듈

**Files:**
- Create: `scripts/build-local-debt.mjs`
- Create (generated): `src/lib/data/local-debt-official.ts`
- Test: `src/lib/data/__tests__/local-debt-official.test.ts`

**Interfaces (Produces):**
```ts
export const OFFICIAL_DEBT_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024] as const;
export type OfficialDebtYear = (typeof OFFICIAL_DEBT_YEARS)[number];
export interface OfficialDebtEntity {
  /** 원자료 이름 그대로. 예: '서울본청', '경기수원시' */
  key: string;
  /** 시도 약칭: 서울·부산·대구·인천·광주·대전·울산·세종·경기·강원·충북·충남·전북·전남·경북·경남·제주 */
  region: string;
  /** 광역이면 '본청', 기초면 자치단체명(예: '수원시') */
  name: string;
  level: 'metro' | 'basic';
  /** 억원, OFFICIAL_DEBT_YEARS 순서. 원자료 없는 해는 null */
  debtEok: (number | null)[];
  budgetEok: (number | null)[];
}
export const OFFICIAL_LOCAL_DEBT: readonly OfficialDebtEntity[];
export const OFFICIAL_DEBT_SOURCE: { title: string; url: string; fetchedAt: string; note: string };
```
- 억원 변환: `Math.round(원 / 1e8 * 10) / 10` (소수 1자리).
- region 파싱: 이름 앞 2글자가 시도 약칭 목록에 있으면 그것, 나머지가 name. `'서울본청'` → region 서울, name 본청, level metro.
- 정렬: 원자료 2024 순서 유지.

- [x] **Step 1: 실패하는 테스트**
```ts
// src/lib/data/__tests__/local-debt-official.test.ts
import { OFFICIAL_LOCAL_DEBT, OFFICIAL_DEBT_YEARS, OFFICIAL_DEBT_SOURCE } from '../local-debt-official';

const find = (key: string) => OFFICIAL_LOCAL_DEBT.find((e) => e.key === key)!;
const y = (year: number) => OFFICIAL_DEBT_YEARS.indexOf(year as 2024);

describe('지방채무 공식 데이터', () => {
  it('2018~2024, 243개 자치단체(광역 17 + 기초 226)', () => {
    expect(OFFICIAL_DEBT_YEARS).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    expect(OFFICIAL_LOCAL_DEBT).toHaveLength(243);
    expect(OFFICIAL_LOCAL_DEBT.filter((e) => e.level === 'metro')).toHaveLength(17);
  });
  it('서울본청 2024 채무잔액 113,375.4억, 최종예산 526,690.0억', () => {
    const s = find('서울본청');
    expect(s.region).toBe('서울'); expect(s.name).toBe('본청');
    expect(s.debtEok[y(2024)]).toBeCloseTo(113375.4, 1);
    expect(s.budgetEok[y(2024)]).toBeCloseTo(526690.0, 1);
  });
  it('경기수원시 2024 채무 2,054.5억, 서울강남구 0', () => {
    expect(find('경기수원시').debtEok[y(2024)]).toBeCloseTo(2054.5, 1);
    expect(find('서울강남구').debtEok[y(2024)]).toBe(0);
    expect(find('경기수원시').region).toBe('경기');
    expect(find('경기수원시').name).toBe('수원시');
  });
  it('모든 행의 배열 길이가 연도 수와 같고 key가 유일하다', () => {
    for (const e of OFFICIAL_LOCAL_DEBT) {
      expect(e.debtEok).toHaveLength(OFFICIAL_DEBT_YEARS.length);
      expect(e.budgetEok).toHaveLength(OFFICIAL_DEBT_YEARS.length);
    }
    expect(new Set(OFFICIAL_LOCAL_DEBT.map((e) => e.key)).size).toBe(243);
  });
  it('출처에 지방재정365 URL과 수집일이 있다', () => {
    expect(OFFICIAL_DEBT_SOURCE.url).toContain('lofin365.go.kr');
    expect(OFFICIAL_DEBT_SOURCE.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```
- [x] **Step 2**: `npx jest src/lib/data/__tests__/local-debt-official.test.ts` → module not found.
- [x] **Step 3**: `scripts/build-local-debt.mjs` — Node ESM, 의존성 없음. `data/regional/local-debt/all.csv`를 읽어(`year,name,debt_won,budget_won,ratio_pct`) 2018~2024만 골라 위 구조로 모으고 `src/lib/data/local-debt-official.ts`를 쓴다. 파일 머리 주석: 자동생성·수동 편집 금지, 출처·수집일(`_source.md`의 수집일 사용), 산정공식, 단위. `OFFICIAL_DEBT_SOURCE.title = '지방재정365 지방재정통합공시 — 예산대비채무비율(결산기준, 지표 A015) 자치단체별'`, `url = 'https://www.lofin365.go.kr/portal/LF2220000.do?fyr=2024&byatcClsTy=LCTSSTL21&pfaIndcCd=A015&rgnzDvCd=02&tab=gov'`. `all.csv`가 없으면 안내 메시지와 함께 exit 1.
- [x] **Step 4**: `node scripts/build-local-debt.mjs` → 생성. jest PASS, `npx tsc --noEmit`, `npx eslint src/lib/data/local-debt-official.ts scripts/build-local-debt.mjs`. 생성 파일 크기 확인(≈ 60~90KB 예상).
- [x] **Step 5**: 커밋 `feat(data): 지방재정365 결산 채무잔액 2018~2024 공식 데이터 모듈(자동생성)`. `.gitignore`의 `!/src/lib/data/`가 이미 있어 추적된다.

---

### Task 2: overlay 모듈 — 공식값 덮어쓰기와 순증 계산

**Files:**
- Create: `src/lib/data/fiscal-health-official.ts`
- Test: `src/lib/data/__tests__/fiscal-health-official.test.ts`

**Interfaces (Produces):**
```ts
export type DebtSourceTag = 'official' | 'estimated';
export interface MetroFiscalDataX extends MetroFiscalData { debtSource: DebtSourceTag }
export interface DistrictFiscalDataX extends DistrictFiscalData { debtSource: DebtSourceTag }

/** 사이트 광역 이름 → 원자료 key 목록. 전남광주통합특별시 → ['광주본청','전남본청'] */
export function metroOfficialKeys(metroFullName: string): string[];
/** 사이트 시군구 → 원자료 key. 전남광주통합특별시의 광산구·서구·북구·동구·남구 → '광주…', 나머지 → '전남…' */
export function districtOfficialKey(metroFullName: string, districtName: string): string;

export function getMetroFiscalDataOfficial(): MetroFiscalDataX[];      // debt를 2024 공식 합계로, 없으면 원값 + estimated
export function getAllDistrictFiscalDataOfficial(): DistrictFiscalDataX[];
export function getDistrictFiscalDataOfficial(metroFullName: string): DistrictFiscalDataX[];
export function getMetroDebtHistoryOfficial(metroFullName: string): MetroDebtHistoryEntry[];   // 2018~2024, debt/budget/ratio 공식
export function getDistrictDebtHistoryOfficial(d: DistrictFiscalData): DistrictDebtHistoryEntry[]; // 공식 있으면 공식, 없으면 기존 generateDistrictDebtHistory
/** 최근 3개 연도 순증 평균(억원/년). 실시간 시계용. 공식 없으면 undefined */
export function getMetroYearlyIncreaseOfficial(metroFullName: string): number | undefined;

export interface NetIncreaseRow {
  key: string; region: string; name: string; level: 'metro' | 'basic';
  prevEok: number; currEok: number; deltaEok: number;   // delta = curr - prev
  budgetEok: number | null; deltaPctOfBudget: number | null; ratioPct: number | null;
}
export function netIncreaseRows(year: OfficialDebtYear, level: 'metro' | 'basic'): NetIncreaseRow[]; // year ≥ 2019, prev/curr 둘 다 있는 행만
```
- 시도 약칭 표: 서울특별시→서울, 부산광역시→부산, 대구광역시→대구, 인천광역시→인천, 대전광역시→대전, 울산광역시→울산, 세종특별자치시→세종, 경기도→경기, 강원특별자치도·강원도→강원, 충청북도→충북, 충청남도→충남, 전북특별자치도·전라북도→전북, 전라남도→전남, 광주광역시→광주, 경상북도→경북, 경상남도→경남, 제주특별자치도→제주, 전남광주통합특별시→(광주|전남 분기).
- `MetroFiscalData.debt`의 단위는 억원(기존 파일 주석). 덮어쓸 때 `Math.round`.

- [x] **Step 1: 테스트**
```ts
import { metroOfficialKeys, districtOfficialKey, getMetroFiscalDataOfficial, getAllDistrictFiscalDataOfficial, netIncreaseRows, getMetroYearlyIncreaseOfficial, getDistrictDebtHistoryOfficial } from '../fiscal-health-official';

describe('공식 채무 overlay', () => {
  it('이름 매핑', () => {
    expect(metroOfficialKeys('서울특별시')).toEqual(['서울본청']);
    expect(metroOfficialKeys('전남광주통합특별시').sort()).toEqual(['광주본청', '전남본청']);
    expect(districtOfficialKey('전남광주통합특별시', '광산구')).toBe('광주광산구');
    expect(districtOfficialKey('전남광주통합특별시', '여수시')).toBe('전남여수시');
    expect(districtOfficialKey('강원특별자치도', '춘천시')).toBe('강원춘천시');
  });
  it('광역 16곳 전부 공식값으로 덮인다', () => {
    const rows = getMetroFiscalDataOfficial();
    expect(rows.every((r) => r.debtSource === 'official')).toBe(true);
    expect(rows.find((r) => r.name === '서울특별시')!.debt).toBe(113375);
  });
  it('시군구 227곳 중 제주시·서귀포시(행정시, 원자료 없음)만 추정치로 남는다', () => {
    const rows = getAllDistrictFiscalDataOfficial();
    expect(rows.filter((r) => r.debtSource === 'estimated').map((r) => r.name).sort()).toEqual(['서귀포시', '제주시']);
    expect(rows.find((r) => r.metro === '서울특별시' && r.name === '강남구')!.debt).toBe(0);
    expect(rows.find((r) => r.metro === '전북특별자치도' && r.name === '전주시')!.debt).toBe(4653);
  });
  it('2024 광역 순증: 경기 +4,780억, 서울 −1,050억 (반올림)', () => {
    const rows = netIncreaseRows(2024, 'metro');
    expect(rows).toHaveLength(17);
    expect(Math.round(rows.find((r) => r.region === '경기')!.deltaEok)).toBe(4780);
    expect(Math.round(rows.find((r) => r.region === '서울')!.deltaEok)).toBe(-1050);
  });
  it('2024 기초 순증 1위 전주시', () => {
    const rows = netIncreaseRows(2024, 'basic').sort((a, b) => b.deltaEok - a.deltaEok);
    expect(rows[0].key).toBe('전북전주시');
  });
  it('시계용 연간 증가액은 공식 3년 평균이고 전남광주는 합산', () => {
    expect(getMetroYearlyIncreaseOfficial('서울특별시')).toBeDefined();
    expect(getMetroYearlyIncreaseOfficial('전남광주통합특별시')).toBeDefined();
  });
  it('시군구 채무 이력은 공식 7개 연도', () => {
    const d = getAllDistrictFiscalDataOfficial().find((r) => r.name === '전주시')!;
    const h = getDistrictDebtHistoryOfficial(d);
    expect(h.map((x) => x.year)).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  });
});
```
(테스트의 서울 113375, 전주 4653은 Task 1 데이터에서 `Math.round(debtEok)`로 나온다. 값이 다르면 데이터를 다시 확인하고 테스트가 아니라 원인을 고친다.)
- [x] **Step 2** 실패 확인 → **Step 3** 구현 → **Step 4** jest·tsc·eslint 통과 → **Step 5** 커밋 `feat(data): 공식 채무 overlay와 연도별 순증 계산`.

---

### Task 3: 대시보드 배선 — 공식값 사용, 하드코딩 제거, 출처 표기

**Files:**
- Modify: `src/components/fiscal/FiscalHealthDashboard.tsx` (데이터 접근 함수 교체: `getMetroFiscalData`→`getMetroFiscalDataOfficial`, `getAllDistrictFiscalData`→…Official, `getDistrictFiscalData`→…Official; 198행의 `METRO_YEARLY_DEBT_INCREASE[m.name] ?? m.debt*0.06` → `getMetroYearlyIncreaseOfficial(m.name) ?? m.debt*0.06`)
- Modify: `src/components/fiscal/utils.ts:74`, `src/components/fiscal/MetroDetailModal.tsx:40` — 같은 교체
- Modify: `src/components/fiscal/types.ts` — `METRO_YEARLY_DEBT_INCREASE` 삭제(사용처가 모두 사라진 뒤), `ViewMode`에 `'debtIncrease'` 추가, `MODE_TABS`에 `{ key: 'debtIncrease', label: '채무 순증' }`를 `'debtRatio'` 다음에 삽입. `GLOSSARY['지역채무']` 문구 끝에 " 출처: 지방재정365 결산(통합회계 채무잔액)." 추가.
- Modify: `src/components/fiscal/MetroDebtRatioModal.tsx`, `DistrictDebtRatioModal.tsx` — 이력 함수를 `getMetroDebtHistoryOfficial`/`getDistrictDebtHistoryOfficial`로. 모달 하단 "추정" 문구가 있으면 "지방재정365 결산"으로.
- Modify: `src/components/shared/DataSources.tsx` — 지방재정365 항목 설명에 "채무잔액(결산) 2018~2024 자치단체별" 반영(기존 항목 형식 유지).

- [x] Step 1: `grep -rn "METRO_YEARLY_DEBT_INCREASE\|getMetroFiscalData()\|getAllDistrictFiscalData()\|getDistrictFiscalData(\|generateDistrictDebtHistory\|getMetroDebtHistory(" src/components/fiscal` 로 사용처 전부 나열.
- [x] Step 2: 교체. `debtSource === 'estimated'`인 행이 있으면 카드에 `[추정]` 표시(현재 0건이라 화면엔 안 보이지만 방어).
- [x] Step 3: `npx tsc --noEmit`, `npx eslint src/components/fiscal src/components/shared/DataSources.tsx`, `npx jest`, `npx next build`. `grep -rn METRO_YEARLY_DEBT_INCREASE src` 비어야 함.
- [x] Step 4: 커밋 `refactor(fiscal): 채무잔액을 지방재정365 결산 공식값으로 — 추정 로직·하드코딩 제거`.

---

### Task 4: 「채무 순증」 탭

**Files:**
- Create: `src/components/fiscal/DebtIncreaseSection.tsx` (≤ 280줄; 표 행 컴포넌트가 커지면 `DebtIncreaseTable.tsx` 분리)
- Modify: `src/components/fiscal/FiscalHealthDashboard.tsx` — `{mode === 'debtIncrease' && <DebtIncreaseSection />}`

**화면:**
- 상단 컨트롤: 연도 select(2019~2024, 기본 2024) · 단위 토글(광역/기초) · 기초일 때 시도 필터(전체 + 17 약칭) · 정렬 select(순증 큰 순/작은 순, 예산 대비 순증 %, 채무비율)
- 요약 카드 3개(`primitives.tsx`의 `Cell`/`SectionHeader` 사용): 순증 합계(억원) · 채무 늘린 곳 수 / 줄인 곳 수 / 변동 없음 수 · 순증 1위·순감 1위 이름
- 표: 자치단체 | 전년 말 잔액 | 당해 말 잔액 | 순증 | 예산 대비 순증 % | 채무비율 %. 억원 `toLocaleString('ko-KR')`, 순증 양수 `text-red-400`/음수 `text-emerald-400`, 0은 muted. `overflow-x-auto`. 기초는 기본 상위 30행 + 「전체 보기」 버튼.
- 각주(고정): "순증은 발행액이 아니라 연말 채무잔액의 전년 대비 증감(= 발행 − 상환)입니다. 출처: 지방재정365 지방재정통합공시 예산대비채무비율(결산기준), 통합회계(일반회계+공기업특별회계+기타특별회계+기금). 기초자치단체 226곳 중 2024년 채무가 있는 곳은 74곳입니다." + 원문 링크(`OFFICIAL_DEBT_SOURCE.url`).
- 인라인 스타일 금지. 막대는 넣지 않는다(표만).

- [x] Step 1: 구현 → Step 2: tsc·eslint·jest·build → Step 3: 커밋 `feat(fiscal): 「채무 순증」 탭 — 연도별 광역·기초 잔액 증감 비교`.

---

### Task 5: 브라우저 검증과 문서
- [x] `/fiscal-health`: 탭 목록에 「채무 순증」, 2024 광역 표 17행(경기 +4,780 1위, 서울 −1,050 최하), 기초 전환 시 전주시 1위, 연도 2020으로 바꾸면 값 변화, 모바일 375px 표 가로 스크롤.
- [x] 기존 탭 회귀: 재정현황 카드의 강남구 채무 0, 전주시 4,653; 채무비율 추이 모달이 2018~2024 공식 이력; 실시간 시계가 NaN 없이 동작.
- [x] `.claude/session-2026-09-22.md`에 결과와 갱신 절차(`python scripts/fetch-lofin-debt.py && node scripts/build-local-debt.mjs`) 기록. 푸시·배포는 사용자에게 묻는다.
