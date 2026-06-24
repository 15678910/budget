# 추세 화살표 + 목표-갭 (B) — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**근거**: SDSN/UNESCAP 추세(CR=AGRa/AGRr) 방법론. A(달성도·신호등) 위에 구축.

---

## 1. 목적
각 SDG 목표에 **목표-갭(목표까지 거리)**과 **추세 화살표(↗→↘↓)**를 더해 "지금 어디에 있고, 2030 목표 궤도에 있는가"를 보인다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 추세 | **2점(2018→최신) SDSN CR**, "개략" 명시. 보간 중간연도 미사용(날조 회피) |
| D2 | 목표값 | A의 `targets-data` green (공식/규범/벤치마크 라벨), 목표연도 2030 |
| D3 | base2018 | `getMetroIndicatorData(metro,ind).history[0].value`(=보간 t=0=실측 끝점) → 16광역 병합 |
| D4 | 정직성 | 보간 시계열 미표시, 출처 표기, 인과 주장 0 |

## 3. 계산 (`src/lib/sdg/trend.ts`, 순수·TDD)
- `targetGap(current, green, floor, direction)` → `{ achievement, gapToTarget }`. achievement=scoreTargetBased(기존), gapToTarget=100−achievement(목표까지 남은 거리). 단위 갭(green−current 부호처리)도 옵션.
- `trendCR(base, current, green, baseYear=2018, currentYear=2025, targetYear=2030)` → `{ agra, agrr, cr, arrow }`:
  ```
  AGRa = (current/base)^(1/(currentYear-baseYear)) - 1
  AGRr = (green/base)^(1/(targetYear-baseYear)) - 1
  CR   = AGRa / AGRr
  ```
  - 방향은 green/base 위치로 자연 처리(higher_better green>base, lower_better green<base). cur/base·green/base는 양수라 실수 거듭제곱 안전.
  - **경계 방어**: base≤0 → null. |AGRr|<ε(목표≈기준, 이미 달성) → cur가 목표 충족이면 'on_track' 아니면 'decreasing'. CR→화살표: ≥0.95 on_track ↗ / 0.6~0.95 improving → / 0~0.6 stagnating ↘ / <0 decreasing ↓.
- `goalTrend(goalNum, region, …)` → goal에 매핑된 지표들의 추세 종합(대표지표 or 평균 CR) + 화살표.
- 테스트: 방향별(higher/lower) on_track/decreasing 케이스, CR 경계(0.95/0.6/0), base≤0·AGRr≈0 방어, targetGap 경계.

## 4. base2018 어셈블러
- `src/lib/sdg/board-data.ts`(또는 신규)에 `assembleBase2018()` → `{ base2018ByIndicator: Record<indId, Record<canon16, number>> }`. `assembleIndicatorValues` 패턴 재사용: 17 RAW 정식명 순회 → `getMetroIndicatorData(name,ind).history[0].value` → SIDO_FULL_TO_SHORT(광주/전남 분리) → `mergeToCanon16(ratio, population)`.

## 5. UI (기존 컴포넌트 수정)
- **전국 카드**(SDGNationalSummary): 기존 달성도 배지 옆에 **추세 화살표** + "목표갭 N" 작은 표기.
- **광역 프로파일**(SDGRegionProfile): 목표 게이지에 **추세 화살표** + 목표갭. 게이지 끝에 목표선(green) 마커 옵션.
- (선택) VLR ③ 섹션에 추세 컬럼 추가.
- 상시 고지: **"추세 = 2점(2018→최신) 개략 · 중간연도 미반영 · 목표 2030 · SDSN CR 방법론"**.

## 6. 검증
- jest `trend.test.ts`: trendCR/targetGap (위 케이스), base2018 어셈블러 16광역 키·광주전남 병합.
- 컴포넌트: tsc + build + 프리뷰(화살표·목표갭 표시, 고지). 콘솔 0.

## 7. 정직성/거버넌스
- 보간 sparkline 금지. 2점 추세 "개략" 라벨. base2018/target 출처. 인과 0. 달성도/추세/상대점수 의미 구분.
- feat 브랜치 → 리뷰 → 병합.

## 8. 비범위 (후속)
- 정밀 다년 추세(KOSIS 2015~2025 수집) → 후속.
- 연계성 → C / 실효성 → D.
- 진학률 등 실측 다년의 정밀 추세(2점 대신 회귀) → 후속 옵션.
