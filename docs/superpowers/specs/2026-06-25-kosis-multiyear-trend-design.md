# KOSIS 다년 정밀 추세 인프라 (검증 지표) — 설계 명세

**작성일**: 2026-06-25
**상태**: 설계 확정 (구현 대기)
**근거**: B(2점 SDSN CR) 한계 보완. KOSIS OpenAPI 다년 시계열(검증: 고용률 2016~2025×17시도) → 실측 선형회귀 추세.

---

## 1. 목적
**경험적으로 검증된 KOSIS 지표**(고용률 goal8, GRDP goal9)를 다년 시계열로 수집해 **실측 선형회귀 추세**(2점 개략 대체)를 제공한다. 재사용 인프라 + 표 추가는 한 줄 설정. 검증 안 된 표는 **미포함**(날조 금지).

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 범위 | **검증된 지표만**(고용률·GRDP). 신규 표는 16시도·다년 API 확인 후 1줄 추가 |
| D2 | 수집 | `newEstPrdCnt=10`(최근 10년). `bySido`(최신, **기존 호환**) + `seriesBySido`(year→값) 병기 |
| D3 | 추세 | **실측 선형회귀**(slope·CAGR·R²). 해당 goal은 "실측 N년 회귀", 나머지는 "2점 개략" 라벨 |
| D4 | 정직성 | 실측 다년(보간 아님)이므로 **스파크라인 정직 표시 가능**. KOSIS 출처·회귀 방법·N·연도범위 명시. 인과 0 |

## 3. 수집 (`scripts/fetch-kosis-sdg.mjs` 수정)
- `newEstPrdCnt=1` → `10`. 각 지표 출력: `{ label, source, unit, higherBetter, year(최신), bySido:{sido:최신값}, seriesBySido:{sido:{year:값}} }`.
- `bySido`는 최신연도 값(기존 소비처 `goals[g].bySido[short]` 호환 보존).
- 시도 ≥10 필터 유지. 안전: 네트워크 실패 시 해당 goal 스킵(기존 파일 보존). 재실행해 실데이터 수집.
- INDICATORS 배열 = 표 추가 지점(한 줄). 신규 표는 **사전 API 검증 통과분만** 주석에 검증일 표기.

## 4. 추세 라이브러리 (`src/lib/sdg/multiyear-trend.ts`, 순수·TDD)
- `linearTrend(points: {year:number, value:number}[])` → `{ n, firstYear, lastYear, slope, cagr, r2 } | null`:
  - 최소제곱 회귀(year→value). slope=연간 변화량. cagr=(last/first)^(1/Δyr)−1(first>0). r2=결정계수. n<3 → null.
- `multiYearArrow(series, green, higherBetter, targetYear=2030)` → `TrendArrow`:
  - 회귀 외삽 vs 목표: 예측 도달 페이스를 B의 CR 임계(≥0.95 on_track ↗ / 0.6~0.95 → / 0~0.6 ↘ / <0 ↓)에 매핑. green 없으면 slope 부호로 단순 판정. higherBetter 방향 반영.
- 테스트: linearTrend(완전 직선 slope·r2=1, n<3 null, first≤0 cagr null), multiYearArrow(상승/하락/방향).

## 5. 통합
- `src/lib/sdg/board-data` 또는 page: goal8·9에 `seriesBySido`에서 16광역 병합(mergeToCanon16) → `multiYearArrow` + 시계열.
- UI(SDGRegionProfile/매트릭스): 해당 goal에 **실측 추세 화살표 + 미니 스파크라인(실측 연도점)** + "실측 {N}년 회귀(KOSIS)" 라벨. 나머지 goal은 기존 2점(B) 유지 + "2점 개략" 라벨.
- 상시 고지: "실측 다년(KOSIS) = 선형회귀, 보간 아님 · 2점 개략과 구분 · 인과 아님".

## 6. 검증
- `node scripts/fetch-kosis-sdg.mjs`(키 필요) → goal8·9 다년 수집 확인.
- jest `multiyear-trend.test.ts`: linearTrend·multiYearArrow.
- 컴포넌트: tsc + build + 프리뷰(실측 추세·스파크라인·라벨, 기존 2점과 구분). 콘솔 0. 기존 지도/매트릭스 회귀 없음(bySido 호환).

## 7. 정직성/거버넌스
- 검증된 지표만. 실측 시계열(보간 0). KOSIS 출처·N·연도·회귀 방법 명시. "실측 다년" vs "2점 개략" 구분 라벨. 인과 0.
- feat 브랜치 → 리뷰 → 병합.

## 8. 비범위 (후속)
- 미검증 표(기대수명·신재생·자살률 등) → API 역공학 후 1줄 추가(검증 통과 시).
- 비선형/구간 추세 → 후속.

---

## 부록 A: 검증된 신규 KOSIS 지표 config (2026-06-25, 실 API 호출 검증)

scientist 에이전트가 실제 KOSIS OpenAPI 호출로 16~17시도×다년을 확인한 것만. 추측 금지.

| 목표 | 지표 | orgId | tblId | itmId | objL1 | objL2 | 시도필드 | 필터 | 단위 | higherBetter | 연도 |
|------|------|-------|-------|-------|-------|-------|---------|------|------|--------------|------|
| 3 | 자살률(10만명당) | 101 | DT_1YL21121E | T4 | `0`(계) | ALL | C2_NM | C2≠`00`(전국) | 십만명당 | false | 2015~2024 |
| 5 | 여성 경제활동참가율 | 101 | DT_1DA7014S | T60 | ALL | ALL | C1_NM | C2=`3`(여성) | % | true | 2016~2025 |
| 7 | 신재생에너지 생산량 | 337 | TX_33701_A004 | 16337AAB0 | ALL | ALL | C2_NM | C1=`15337AA800`(신재생합계) | toe | true | 2015~2024 |
| 8 | 실업률 | 101 | DT_1DA7004S | T80 | ALL | (없음) | C1_NM | — | % | false | 2016~2025 |
| 11 | 주택보급률(다가구포함) | 116 | DT_MLTM_2100 | 13103871096T6 | ALL | (없음) | C1코드끝4자리 | C1끝4∈0004~0020 | % | true | 2015~2024 |

- 시도필드: `C1_NM`/`C2_NM`=시도명(FULL_TO_SHORT 매핑) / `C1코드끝4자리`=주택보급률(코드 0004=서울…0020=제주, 0001~0003 합계 제외).
- 파서는 **시도필드 + 필터(objL2 차원 선택)**를 지원하도록 fetchIndicator 일반화 필요.
- 검증 실패: 기대수명 DT_1B44(OpenAPI "데이터없음"), 하수도 TX_315_2009_H1077(직접 보급률 없음) → 미채택.
- 합계출산율 DT_1B81A21: 방향 논쟁적(저출산 맥락 high=good vs 환경 맥락)이라 **제외**(오프레이밍 회피).
- 신규 목표값(green): 방어 가능한 단일 목표 부재 → **MULTIYEAR_GREEN=null**(slope 부호 판정), 고용률 70만 정책목표 유지.
