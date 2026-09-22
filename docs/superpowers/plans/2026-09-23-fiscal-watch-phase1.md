# 재정감시 1단계 구현 계획 — 조기경보 지표판 + 사례 아카이브

> **상태 (2026-09-23): 완료.** 커밋 63c07b6(수집 스크립트) 5e72316(지표 모듈) efc790e(신호) 55da98f(사례 7건) b53b278(아카이브 화면·탭 쿼리·사이드바) 75ea920(조기경보 화면) 86ec113(배선). 리뷰 반영 커밋은 아래 세션 메모 참조.
> 확인된 사실: 2024 결산에서 법정 「주의」 기준 도달 자치단체 0곳(채무비율 최고 광주 21.93%, 통합재정수지 최저 과천 −18.32%), 통합재정수지 적자 178/243. 화면은 기준까지의 여유 폭으로 정렬.
> 데이터 갱신: `python scripts/fetch-lofin-indicators.py && node scripts/build-local-indicators.mjs` (채무는 `fetch-lofin-debt.py && build-local-debt.mjs`).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/fiscal-innovation`에 「조기경보」「사례 아카이브」 탭을 추가한다. 조기경보는 지방재정365 결산 지표 12종(243개 자치단체 × 2019~2024)에 지방재정법 시행령 제65조의3의 법정 기준을 적용해 신호를 표시하고, 아카이브는 낭비로 지목된 사례 7건의 주장·판정·근거를 나란히 싣는다.

**Architecture:** 데이터 `src/lib/data/local-indicators-official.ts`(자동생성, Task 1) → 계산 `src/lib/watch/signals.ts`(법정 기준 상수·백분위) → 사례 데이터 `src/lib/watch/cases/*.ts` → 화면 `src/components/fiscal-watch/*.tsx` → 페이지 `src/app/(ai-society)/fiscal-innovation/page.tsx` 탭 2개(URL 쿼리 `?tab=`) + 허브 사이드바 하위 링크.

**Tech Stack:** Next.js 16, React 19, TS strict, Tailwind v4, Jest. `any`·인라인 스타일·클라이언트 `console.*` 금지, 컴포넌트 300줄 이하, `lib`는 `components`를 import하지 않는다.

**Spec:** `docs/superpowers/specs/2026-09-23-fiscal-watch-design.md`. 사례 근거: `docs/research/2026-09-23-waste-cases-verification.md`(모든 URL·인용문·판정·법정 기준 원문이 여기 있다. 사례 데이터는 이 문서 밖의 사실을 넣지 않는다).

## Global Constraints
- 종합 점수·등급, 효과·손실액 추정, "선거용"·"낭비" 판정 문구 금지. 날짜·수치·판정·출처만.
- 법정 기준 상수 옆에 조문 인용(제65조의3 ①·②, 개정 2025. 12. 2.)과 확인일 2026-09-23을 주석으로.
- 기준 충족 ≠ 지정. 화면마다 "지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량" 문구.
- 데이터 없는 법정 지표(채무상환비비율·지방세징수액비율·금고잔액비율·공기업부채비율)는 「자료 없음」으로 표시, 계산하지 않는다.
- 커밋 트레일러 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. 푸시·배포는 사용자 지시 시.

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `scripts/build-local-indicators.mjs`, `src/lib/data/local-indicators-official.ts` | 지표 12종 생성 모듈 (Task 1, 진행 중) |
| `src/lib/watch/signal-types.ts` | 신호·백분위 타입 |
| `src/lib/watch/legal-thresholds.ts` | 제65조의3 상수 (조문 인용 포함) |
| `src/lib/watch/signals.ts` | `crisisSignals()`, `percentiles()`, `entitySummary()` |
| `src/lib/watch/case-types.ts` | `WatchCase` 등 (Task 3 소유) |
| `src/lib/watch/cases/{daejeon-articulated-bus,incheon-sangsang-platform,incheon-dongincheon,busan-nakdong-bridges,busan-pompidou-opera,ulsan-skywalk,ulsan-food-hall}.ts`, `src/lib/watch/cases/index.ts` | 사례 7건 |
| `src/lib/watch/__tests__/{signals,cases}.test.ts` | |
| `src/components/fiscal-watch/EarlyWarningSection.tsx`, `EntityCard.tsx`, `EntityDetail.tsx`, `labels.ts` | 조기경보 탭 |
| `src/components/fiscal-watch/CaseArchiveSection.tsx`, `CaseDetail.tsx`, `ClaimTable.tsx` | 아카이브 탭 |
| `src/app/(ai-society)/fiscal-innovation/page.tsx` | 탭 2개, `?tab=` 쿼리 |
| `src/components/layout/AISocietySidebar.tsx` | 재정혁신 하위 링크 2개 (`sub` → `subs?: []`) |

---

### Task 1: 지표 데이터 모듈 (별도 지시로 진행 중 — 인터페이스만 기록)
`INDICATOR_YEARS`, `INDICATOR_KEYS`(fiscalBalance·festival·subsidy·entertainment·yearEnd·privateContract·guarantee·ppp·fundBalance·council·independence·quickExec), `IndicatorEntity { key, lafCd, region, name, level, typeCd, peerCd, values, peerAvg }`, `OFFICIAL_INDICATORS`, `INDICATOR_SOURCE`.

---

### Task 2: 신호 계산

**Files:** Create `src/lib/watch/signal-types.ts`, `legal-thresholds.ts`, `signals.ts`; Test `src/lib/watch/__tests__/signals.test.ts`.

**Interfaces (Produces):**
```ts
// signal-types.ts
export type SignalLevel = 'critical' | 'caution' | 'normal' | 'no-data';   // 심각 / 주의 / 해당 없음 / 자료 없음
export type LegalIndicator = 'fiscalBalance' | 'debtRatio' | 'debtService' | 'taxCollection' | 'treasury' | 'publicCorpDebt';
export interface CrisisSignal { indicator: LegalIndicator; level: SignalLevel; value: number | null; year: number }
export type WasteIndicator = 'festival' | 'subsidy' | 'entertainment' | 'yearEnd' | 'privateContract';
export interface PercentileRank { indicator: WasteIndicator; value: number | null; peerAvg: number | null; percentile: number | null; groupSize: number; typeCd: string }
export interface EntitySummary { key: string; region: string; name: string; level: 'metro' | 'basic'; typeCd: string; crisis: CrisisSignal[]; waste: PercentileRank[]; debtDelta3y: number | null }

// legal-thresholds.ts — 지방재정법 시행령 제65조의3 ①(위기)·②(주의), 개정 2025. 12. 2., 국가법령정보센터 2026-09-23 확인
export const LEGAL_THRESHOLDS: Record<LegalIndicator, { caution: [number, number]; critical: number; direction: 'above' | 'below'; label: string; article: string }>;
//  fiscalBalance: 음의 값의 절대값 기준 — caution (25, 30], critical > 30, direction 'above' (절대값에 적용)
//  debtRatio: caution (25, 40], critical > 40
//  debtService: (12, 17], > 17 — 자료 없음
//  taxCollection: direction 'below' — caution [70, 80), critical < 70 — 자료 없음
//  treasury: 'below' — caution [10, 20), critical < 10 — 자료 없음
//  publicCorpDebt: (400, 600], > 600 — 자료 없음

// signals.ts
export function crisisSignals(entityKey: string, year: IndicatorYear): CrisisSignal[];   // 6개 항목 모두 반환, 자료 없는 4개는 no-data
export function percentiles(year: IndicatorYear): Map<string, PercentileRank[]>;          // typeCd 그룹 안에서 값 내림차순 백분위(상위 x% 이내, 1~100). 동일값은 같은 순위(최소 순위). null은 제외·groupSize에 미포함
export function entitySummaries(year: IndicatorYear): EntitySummary[];                     // 243개. debtDelta3y = getMetroYearlyIncreaseOfficial 류가 아니라 local-debt-official에서 year-3→year 순증(억), 없으면 null
export function nationalCounts(year: IndicatorYear): { cautionOrWorse: Record<LegalIndicator, number>; deficitCount: number };
```
- 채무비율은 `local-debt-official.ts`(debt/budget×100, 결산)에서, 통합재정수지비율은 `local-indicators-official.ts` `fiscalBalance`에서. 두 모듈 모두 key = lafNm으로 조인.
- 백분위 정의: `percentile = ((해당 값보다 큰 값의 개수 + 1) / groupSize) × 100`을 소수 없이 반올림 → "상위 N% 이내". 값이 가장 큰 자치단체가 1등이므로 N은 1 이상 100 이하이고 "상위 0%"는 나오지 않는다. 값이 클수록 상위. 그룹은 `typeCd`(22/31/32/33).

- [x] Step 1 테스트: 
  - `LEGAL_THRESHOLDS.debtRatio` = caution (25,40], critical 40; `fiscalBalance` 절대값 기준
  - 합성 엔티티로 `crisisSignals`: 채무비율 26 → caution, 41 → critical, 10 → normal; 통합재정수지 −31 → critical, −26 → caution, +5 → normal; 자료 없는 4개 → no-data
  - 실데이터: 2024 서울본청 debtRatio 21.53 → normal; `nationalCounts(2024).cautionOrWorse.debtRatio`가 0 이상의 정수; `percentiles(2024)` 서울종로구의 festival percentile이 1~100, groupSize = typeCd '33' 개수(69)
  - 동일값 처리: 값 [5,5,3] → 백분위 [33,33,100]
- [x] Step 2 실패 확인 → Step 3 구현 → Step 4 `npx jest src/lib/watch`·tsc·eslint → Step 5 커밋 `feat(watch): 법정 재정위기 기준 신호와 동종단체 백분위 계산`

---

### Task 3: 사례 데이터 7건 (Task 2와 병렬 가능 — 파일 겹침 없음)

**Files:** Create `src/lib/watch/case-types.ts`, `src/lib/watch/cases/*.ts`(7건), `src/lib/watch/cases/index.ts`; Test `src/lib/watch/__tests__/cases.test.ts`.

`case-types.ts`는 설계문서 §2.2의 타입을 그대로 쓴다(`Verdict`, `StructuralTag`, `ProcedureStatus`, `CaseSource`, `CaseClaim`, `CaseEvent`, `CaseProcedure`, `WatchCase`). `gov`는 `@/lib/programs/types`의 `GovUnit`(중앙 '00', 시도 2자리, 시군구 5자리 — 대전 '30', 인천 '28', 부산 '26', 울산 '31').

`index.ts`: `export const WATCH_CASES: readonly WatchCase[]`, `getWatchCase(slug)`, `ELECTION_DAY = '2026-06-03'`, `daysBetween(a, b)`.

내용 규칙: `docs/research/2026-09-23-waste-cases-verification.md`의 표를 그대로 옮긴다 — claim.statement는 보고서 주장 취지, verdict는 표의 판정, finding은 근거 칸의 사실 문장, sources는 URL과 인용문. 타임라인은 문서에 날짜가 있는 사건만. `procedures`는 근거가 있는 것만 채우고 나머지는 `unknown` + note "확인 자료 없음". `tags`는 confirmed/partial claim이 뒷받침할 때만(예: 울산 음식문화관 → procedural-evasion; 동인천역 → election-cycle은 "착공식이 선거 177일 전"이라는 확인 사실에 근거하되 태그 설명은 날짜 사실만). `summary`는 판정 없는 사실 3문장.

- [x] Step 1 테스트(`cases.test.ts`): 7건, slug 유일·kebab-case, `gov` 유효(`isValidGovCode`), 모든 claim에 source ≥ 1과 `https://` URL, verdict가 `refuted`면 finding 길이 > 20, tags가 있으면 confirmed/partial claim ≥ 1, verifiedAt 형식, timeline 날짜 오름차순, `daysBetween('2025-12-08', ELECTION_DAY) === 177`
- [x] Step 2~5: 실패 확인 → 데이터 작성 → 통과 → 커밋 `feat(watch): 예산 낭비 지목 사례 7건 — 주장·판정·근거 데이터`

---

### Task 4: 화면 — 조기경보 탭

**Files:** Create `src/components/fiscal-watch/labels.ts`, `EntityCard.tsx`, `EntityDetail.tsx`, `EarlyWarningSection.tsx`(각 ≤ 250줄).

- 컨트롤: 연도(2019~2024, 기본 2024) · 단위 광역/기초 · 기초일 때 시도 select
- 요약 셀 3개: 「주의 이상」 수(채무비율·통합재정수지 각각) · 통합재정수지 적자 자치단체 수 · 3년 채무 순증 상위 5
- 카드 그리드: 이름 · 위기 칩 6개(심각=red, 주의=amber, 해당 없음=muted, 자료 없음=dashed) · 낭비 신호 5개 "상위 N%" 미니바(10단계 폭 클래스) · 3년 순증
- 카드 클릭 → `EntityDetail`: 지표별 2019~2024 표(값·동종단체 평균), 채무비율 이력(`getDistrictDebtHistoryOfficial`/metro 대응), 해당 자치단체 사례 링크(`WATCH_CASES.filter(gov.code prefix)`)
- 각주 고정: 출처(지방재정365 통합공시 지표 코드·수집일), 제65조의3 인용, "기준 충족은 지정이 아니다", "백분위는 순위이지 평가가 아니다"
- 스타일은 `src/components/fiscal/primitives.tsx`(`Cell`, `SectionHeader`)와 기존 재정혁신 탭(gray-950 배경)에 맞춘다.

- [x] 구현 → tsc·eslint·jest → 커밋 `feat(watch): 조기경보 지표판 — 법정 기준 신호·동종단체 백분위`

---

### Task 5: 화면 — 사례 아카이브 탭 + 페이지·사이드바 배선

**Files:** Create `src/components/fiscal-watch/ClaimTable.tsx`, `CaseDetail.tsx`, `CaseArchiveSection.tsx`; Modify `src/app/(ai-society)/fiscal-innovation/page.tsx`, `src/components/layout/AISocietySidebar.tsx`.

- 목록: 카드(자치단체 · 사업 · 금액 · 태그 칩 · 상태 · 검증일), 태그·시도 필터. 상단 고정 문구(설계 §4.2).
- 상세: 요약 → 타임라인(선거일 2026-06-03 자동 삽입, 각 사건과의 간격 일수) → `ClaimTable`(주장 / 판정 배지: 확인=emerald, 부분확인=amber, 반박=red, 미확인=gray / 근거 / 출처 링크 `target=_blank rel=noopener`) → 절차 점검 4항목 → 태그와 근거 claim → 출처 목록
- 페이지: `TabKey`에 `'watch' | 'cases'`, `TABS`에 `{ key: 'watch', label: '조기경보', color: 'text-red-400' }`, `{ key: 'cases', label: '사례 아카이브', color: 'text-orange-400' }`. 초기 탭을 `useSearchParams().get('tab')`으로 읽고(유효하지 않으면 'interest'), 탭 클릭 시 `router.replace('?tab=…', { scroll: false })`. `useSearchParams`는 `Suspense` 경계 필요 — 페이지 본문을 `<Suspense>`로 감싼다.
- `AISidebar` sections에 `{ id: 'content', label: … }` 유지.
- 사이드바: `HubTool.sub` → `subs?: { href; label }[]`로 일반화(SDG 관계도는 `subs: [{…}]`로 이전), 재정혁신에 `subs: [{ href: '/fiscal-innovation?tab=watch', label: '조기경보' }, { href: '/fiscal-innovation?tab=cases', label: '사례 아카이브' }]`. 활성 판정은 `pathname + search`.

- [x] 구현 → tsc·eslint·jest·`npx next build` → 커밋 `feat(watch): 사례 아카이브 탭, 재정혁신 탭 URL 쿼리, 사이드바 하위 링크`

---

### Task 6: 검증·문서
- [x] dev 서버: `/fiscal-innovation?tab=watch` 2024 광역 카드 17장, 서울 채무비율 칩 「해당 없음(21.53%)」, 자료 없음 칩 4개, 기초 전환·시도 선택, 카드 상세 표; `?tab=cases` 7건, 대전 굴절버스 상세에서 「반박」 배지(비상망치 주장)와 SBS 출처 링크, 동인천역 타임라인 "선거 177일 전"; 기존 5개 시뮬레이터 탭 정상; 모바일 375px 가로 스크롤 없음; 콘솔 오류 0(HMR 제외)
- [x] 계획 체크박스 갱신, `.claude/session-2026-09-23.md`, 푸시·배포는 사용자에게 묻는다.
