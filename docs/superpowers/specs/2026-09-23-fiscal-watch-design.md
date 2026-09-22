# 재정감시 — 조기경보 지표판 + 사례 아카이브 설계

- 작성 2026-09-23
- 상태: 사용자 승인(설계 4절) → 본 문서로 정리. 1단계 범위만 구현 가능한 수준으로 정의한다.
- 위치: AI기본사회 › 재정혁신(`/fiscal-innovation`) 탭 2개 추가 — 「조기경보」「사례 아카이브」. 2단계 이후 「사업타당성」「의회 안건」이 같은 자리에 붙는다.
- 관련: `docs/superpowers/plans/2026-09-22-local-debt-official.md`(공식 채무 데이터·순증 탭), `src/lib/data/local-debt-official.ts`, `src/lib/data/fiscal-health-official.ts`

## 0. 한 문장

지방정부의 재정 위험 신호를 **정부 자신의 법정 기준**과 **공식 결산 지표**로 보여주고, 예산 낭비로 지목된 사업은 **주장·판정·근거**를 나란히 실어 독자가 판단하게 한다. 사이트는 "선거용", "낭비"라고 결론짓지 않는다.

## 1. 배경

- 사용자 요청: 재정혁신 아래 사업타당성 · 재정운용 과정 공개 · 낭비 예방(의회 안건) 기능. 참고 자료로 지자체 재정위기·예산 낭비 보고서(동영상 요약)를 받음.
- 검증 결과(2026-09-23, 1차 자료 대조): 보고서의 11개 주장 중 확인 6, 부분확인·표현 교정 4, 반박 4, 미확인 2. 예 — 대전 굴절버스 부적합 사유는 "비상망치"가 아니라 총중량 54톤(도로법 40톤 초과); 동인천역 착공 구간 보상률은 5%가 아니라 약 91%; 울산 스카이워크는 개장 100일에 9만 5천 명 방문(방문객 저조 주장 반박); 오페라 "1회 115억"은 5회 패키지 105~115억.
- 그래서 아카이브의 단위는 "사례"가 아니라 **"주장"**이다. 주장마다 판정과 출처를 붙이고, 반박된 주장도 지우지 않는다.
- 조기경보의 판정 기준은 사이트가 만들지 않는다. 지방재정법 제55조의2·시행령 제65조의2의 **재정주의·재정위기단체 지정 기준**을 그대로 쓴다(수치는 구현 전 법령 원문으로 확정, §3.2).

## 2. 데이터

### 2.1 조기경보 지표 (지방재정365 통합공시, 결산기준, 자치단체별 243곳, 2019~2024)

수집: `scripts/fetch-lofin-indicators.py` → `data/regional/local-indicators/` (gitignore). 생성: `scripts/build-local-indicators.mjs` → `src/lib/data/local-indicators-official.ts`(자동생성, 수동 편집 금지).

| 코드 | 지표 | 쓰임 | 값 필드 |
|---|---|---|---|
| A015 | 예산대비채무비율 | 위기 기준(법정) | 보유 (`local-debt-official.ts`) |
| A064 | 통합재정수지비율 | 위기 기준(법정) — 적자비율 | `ccgbRt`(%), 세입 `txrvAmt`, 세출 `epAmt`, 순융자 `nfnlnAmt` |
| A030 | 보증채무비율 | 위기 보조 | `gurDbtRt`, `gurDbtAmt` |
| A032 | 민자사업 재정부담액 | 위기 보조 | `pvcpAmt`, `btlOpct`, `btoSprf` |
| — | 채무 순증 | 위기 보조 | 보유 (`netIncreaseRows`) |
| A001 | 행사·축제경비비율 | 낭비 신호 | `expsRt`, `expsAmt` |
| A003 | 업무추진비비율 | 낭비 신호 | `boeRt`, `boe` |
| A002 | 지방보조금비율 | 낭비 신호 | `amtRt`, `grsbAmt` |
| A013 | 연말지출비율 | 낭비 신호 | `yndEpRt`, `ecaAmt` |
| A026 | 수의계약비율 | 낭비 신호 | `pvcnRt`, `pvcnOutAmt` |
| A005 | 지방의회경비비율 | 참고 | `lclAsmbExpsRt` |
| A023 | 기금현재액 | 여력 | `thyPsntAmt`, `pryrPsntAmt`, `thyUseAmt` |
| A060 | 재정자립도(결산) | 참고 | `firRt` |
| A046 | 신속집행 실적 | 참고 | `trgtAmtCprnExeRt` |

- 원자료는 원·%. 생성 모듈은 금액을 억원 소수 1자리, 비율은 원값(소수 2자리)으로 둔다.
- 각 행에 `lafCd`(7자리, 예 `1100000` 서울본청)와 `lafNm`이 있다. 사이트 시도명 매핑은 `fiscal-health-official.ts`의 규칙을 재사용한다.
- `smkdAvgRt`(동종단체 평균)가 응답에 있으면 함께 보존한다 — 낭비 신호의 비교 기준.

**없는 것**: 재정안정화기금 잔액, 지방채 발행 한도·한도 사용률, 채무상환비비율, 금고잔액, 공기업 부채비율(별도 지표 A009는 있으나 자치단체 단위가 아님). 이 중 법정 기준에 들어가는 것(채무상환비비율·지방세 징수 감소율·금고잔액·공기업 부채비율)은 **데이터가 없으면 그 신호를 "자료 없음"으로 표시**하고 계산하지 않는다. 행안부 자료가 확보되면 추가.

### 2.2 사례 아카이브 (편집 데이터, `src/lib/watch/cases/*.ts`)

```ts
export type Verdict = 'confirmed' | 'partial' | 'refuted' | 'unverified';   // 확인 / 부분확인 / 반박 / 미확인
export type StructuralTag = 'election-cycle' | 'no-check' | 'procedural-evasion' | 'evidence-integrity';
//  선거 주기 / 견제 부재 / 절차 편법 / 근거 훼손
export type ProcedureStatus = 'done' | 'not-done' | 'disputed' | 'unknown';

export interface CaseSource { title: string; publisher: string; date: string; url: string; quote?: string }
export interface CaseClaim {
  /** 보고서·언론이 제기한 주장, 원문 취지대로 */
  statement: string;
  verdict: Verdict;
  /** 판정 이유 — 확인된 사실 또는 어긋나는 사실 */
  finding: string;
  sources: CaseSource[];
}
export interface CaseEvent { date: string; label: string; source?: CaseSource }   // 타임라인. 선거일은 자동 삽입
export interface CaseProcedure {
  key: 'investment-review' | 'feasibility-study' | 'council-approval' | 'disclosure';
  //  투자심사(지방재정법 제37조) / 타당성조사(500억 이상) / 의회 의결(공유재산·계약) / 정보공개
  status: ProcedureStatus; note: string; source?: CaseSource;
}
export interface WatchCase {
  slug: string; gov: GovUnit; title: string;
  amountEok: number | null; amountNote: string;
  summary: string;                 // 3문장 이내, 판정과 무관한 사실만
  timeline: CaseEvent[];
  claims: CaseClaim[];
  procedures: CaseProcedure[];
  tags: StructuralTag[];           // 근거가 되는 claim이 confirmed/partial일 때만 붙인다
  status: string;                  // '감사원 공익감사 청구(2026-04-06)' 등
  verifiedAt: string;              // YYYY-MM-DD
}
```

- **초기 7건**: 대전 전기 굴절버스, 인천 상상플랫폼, 인천 동인천역 착공식, 부산 낙동강 횡단 교량, 부산 퐁피두 분관·오페라하우스 공연, 울산 태화루 스카이워크, 울산 세계음식문화관. 내용은 2026-09-23 검증 결과(에이전트 보고 2건)를 그대로 쓰고, 주장 문구는 보고서 원문 취지를 유지한다.
- 테스트가 강제: 모든 claim에 source ≥ 1과 URL; verdict가 `refuted`인 claim은 `finding`에 어긋나는 사실 필수; tag는 confirmed/partial claim이 하나 이상 있을 때만; `gov`는 `isValidGovCode`.

## 3. 계산과 판정

### 3.1 낭비 신호 — 백분위만
각 낭비 신호 지표에 대해 같은 단위(광역끼리, 기초는 시·군·구 유형별 — `lafTyCd`)의 분포에서 **상위 몇 %인지**만 계산한다. "많다/적다"의 절대 기준은 두지 않는다. 화면에는 "동종단체 중 상위 12% (평균 0.31%, 이 단체 0.58%)"처럼 숫자를 그대로 쓴다.

### 3.2 위기 신호 — 법정 기준
지방재정법 시행령 제65조의2(재정위기단체 지정 기준)의 **주의·심각** 기준을 코드 상수로 두고, 상수 옆에 조문 인용과 확인일을 적는다. 수치는 구현 전 국가법령정보센터 원문으로 확정한다(조사 진행 중). 확인된 지표만 계산하고, 나머지는 「자료 없음」.

### 3.3 하지 않는 것
종합 점수·등급, 효과·손실액 추정, 책임자 지목, 검증 안 된 주장 게재, "선거용"이라는 판정. 타임라인에는 선거일(2026-06-03 제9회 전국동시지방선거)을 사실로 넣고 간격(일수)을 표시할 뿐이다.

## 4. 화면

### 4.1 「조기경보」 탭
1. 전국 요약 셀 3개: 법정 기준 「주의」 이상 자치단체 수(지표별) · 통합재정수지 적자 자치단체 수 · 채무 순증 상위 5
2. 광역 17장 카드(기본) / 시도 선택 시 기초 카드. 카드: 이름 · 위기 신호 칩(주의/심각/자료 없음) · 낭비 신호 5개의 백분위 미니바 · 채무 순증 3년
3. 카드 클릭 → 상세: 지표별 2019~2024 표(값·동종단체 평균), 해당 자치단체의 아카이브 사례 링크
4. 각주: 출처(지방재정365 통합공시, 지표 코드, 수집일), 법정 기준 조문, "백분위는 순위이지 평가가 아니다"

### 4.2 「사례 아카이브」 탭
1. 목록: 자치단체 · 사업 · 금액 · 태그 · 상태 · 검증일. 태그·자치단체 필터
2. 상세: 요약 → 타임라인(선거일 자동 표시, 간격 일수) → **주장과 판정 표**(주장 / 판정 배지 / 근거 / 출처 링크) → 절차 점검 4항목 → 구조 태그와 그 근거 claim → 출처 목록
3. 상단 고정 문구: "이 아카이브는 제기된 주장을 1차 자료로 대조한 결과입니다. 반박된 주장도 남겨 둡니다. 판단은 독자가 합니다."

### 4.3 배치
`/fiscal-innovation` `TABS`에 `{ key: 'watch', label: '조기경보' }`, `{ key: 'cases', label: '사례 아카이브' }` 추가. `AISidebar` sections에 두 절 추가. 허브 사이드바(`AISocietySidebar`)의 재정혁신 항목에 `sub` 링크 2개(`/fiscal-innovation?tab=watch`, `?tab=cases`) — 탭 상태를 URL 쿼리로 읽도록 페이지 수정.

## 5. 검증
- 데이터: 지표별 행 수(연도별 243), 코드·이름 매핑 100%, 억원 변환 검산(서울본청 2024 기금현재액 82,171.6억 등 원자료 대조값 3개 이상)
- 신호: 법정 기준 상수가 조문과 일치(테스트 주석에 인용), 백분위 계산이 동일값 처리 포함 결정론적
- 사례: 위 §2.2 무결성 테스트 + 링크 형식 검사
- 화면: tsc·eslint·jest·build, 브라우저에서 두 탭·카드 상세·모바일 스크롤, 기존 5개 시뮬레이터 탭 회귀 없음

## 6. 단계
- 1단계(이 문서): 지표 수집·생성 → 신호 계산 → 사례 7건 → 두 탭 → 검증
- 2단계: 사업타당성 체크리스트(사례의 `procedures`를 입력 틀로 확장, 독자 가중치)
- 3단계: 의회 안건 모니터(서울시의회 API부터)
- 별도: 재정안정화기금·지방채 한도 데이터 확보 시 위기 신호 추가; 사례는 검증 결과가 나오는 대로 추가(각 건 1차 자료 필수)
