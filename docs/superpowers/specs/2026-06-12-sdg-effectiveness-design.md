# 실효성·효율성 패널 (D) — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**근거**: OECD 평가 6기준(2024), output/outcome/impact 구분, 귀속(attribution) 한계. A(달성도)·B(추세)·재정 데이터 위에 구축. **A~D 국제기준 평가 체계의 마지막 단계.**

---

## 1. 목적
지역의 **예산 대비 성과(효율)**와 **산출→성과(실효)**를 OECD 평가틀로 보이되, **정책 인과 귀속은 불가**함을 정직하게 명시한다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 구성 | **예산-성과 효율 사분면 + output/outcome 패널 + OECD 면책** |
| D2 | 효율 | 1인당 예산 × 종합 달성도 16광역 산점도, 중앙값 4사분면 |
| D3 | 정직성 | **인과 귀속 불가(반사실 없음)·예산-성과=상관·여건 차이·OECD 6기준** 상시 고지. 정책효과 단정 0 |

## 3. 계산 (`src/lib/sdg/effectiveness.ts`, 순수·TDD)
- `overallAchievement(region, valuesByIndicator, direction)` → 데이터 보유 목표 달성도 평균(0~100)|null.
- `budgetEfficiency(regions, fiscalByRegion, valuesByIndicator, direction)` → `{ points:[{region, perCapitaBudget, achievement, quadrant}], medianX, medianY }`:
  - perCapitaBudget = `budget(억원) / population` (또는 ×만원/인 단위 — 일관 단위 명시).
  - quadrant: x(예산)·y(달성도) 중앙값 기준 → `efficient`(저예산·고성과)/`invest`(고예산·고성과)/`limited`(저예산·저성과)/`review`(고예산·저성과).
  - 데이터 없는 광역(달성도/재정 null) 제외.
- `outcomeSummary(region, …)` → `{ output:{budget,independence,debtRatio}, outcome:{achievement, lightCounts:{green,yellow,orange,red}, trend:{up,down}}, rank }`. (신호등=A, 추세=B 재사용.)
- 테스트: perCapita 계산·중앙값 분할·4사분면 분류 경계·데이터 없는 광역 제외·overallAchievement 평균.

## 4. 컴포넌트 (`src/components/sdg/EffectivenessPanel.tsx`)
- **효율 사분면 산점도**(SVG): x=1인당 예산, y=종합 달성도, 중앙선(중앙값) 점선, 4사분면 라벨, 점=광역명, 선택 광역 강조. 호버=「광역: 1인당 X · 달성도 Y · 사분면」.
- **output/outcome 패널**: Output(재정)·Outcome(달성도·신호등 분포·추세 ↗N/↘N)·Impact(면책 박스 "귀속 불가")·Benchmarking(순위).
- 상단 **강한 면책 박스**(D3 전문, OECD 6기준).
- 위치: `src/app/(ai-society)/sdg/effectiveness/page.tsx`(URL `/sdg/effectiveness`) + `/sdg` 진입 링크.
- 인라인 style 동적값만, 300줄↓(초과 시 분리).

## 5. 검증
- jest `effectiveness.test.ts`: budgetEfficiency(perCapita·중앙값·사분면 경계·제외), overallAchievement, outcomeSummary.
- 컴포넌트: tsc + build + 프리뷰(산점도·패널·면책). 콘솔 0.

## 6. 정직성/거버넌스
- 예산-성과=상관(여건 차이 면책). Impact=귀속 불가 명시. OECD 인용. 정책효과/인과 단정 0. 데이터 보유 목표만.
- feat 브랜치 → 리뷰 → 병합.

## 7. 비범위 (후속)
- 반사실/준실험 영향평가 → 영구 제외(데이터 없음·범위 밖).
- SDG별 예산 배분(세출 미분류) → 영구 제외(날조 금지).
- 정밀 다년 효율 추세 → 후속.
