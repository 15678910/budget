# 정책 연계성(시너지/상충) — 데이터 상관 (C) — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**근거**: Nilsson(2016) SDG 상호작용, IGES SDG Interlinkages(Pearson/Spearman). 단, **n=16 한계로 탐색적 관측만**.

---

## 1. 목적
17 SDG 목표 간 **시너지/상충**을 우리 16광역 달성도 점수의 상관으로 탐색적으로 보인다. 정책 효과·인과를 단정하지 않는다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 출처 | **데이터 상관**(16광역 달성도 Spearman). Nilsson 문헌은 후속 |
| D2 | 표현 | **연계성 매트릭스 히트맵**(목표×목표, r 색) (+ 선택 네트워크) |
| D3 | 임계 | |r|≥0.5 강조(IGES/연구), 약한 상관 흐리게 |
| D4 | 정직성 | **탐색적·상관≠인과·n=16·간접경로 가능·정책효과 단정 0** 상시 고지. 방법론·참고문헌 명시 |

## 3. 계산 (`src/lib/sdg/interlinkage.ts`, 순수·TDD)
- `spearman(x:number[], y:number[])` → r(−1~1). 순위 변환(동순위 평균순위) 후 Pearson. 길이 불일치/<2 → null.
- `interlinkageMatrix(achievementByGoal)` — 입력: `Record<goalNum, Record<region, score>>`(데이터 보유 목표만). 각 목표 쌍(i,j)에 대해 **두 목표 모두 점수 있는 공통 지역**의 점수 벡터로 spearman. 공통 지역 <5면 null(표본부족). 출력: `{ pairs: [{a,b,r,n}], goals:number[] }`. 대각(자기)=1.
- 테스트: spearman 알려진 케이스(완전 양/음 상관 ±1, 동순위), interlinkageMatrix 대칭·공통지역<5 null·데이터없는 목표 제외.

## 4. 데이터
- 입력 = goal별 16광역 달성도: `regionGoalAchievement(region,…).score`를 16광역 순회해 `{goal: {region: score}}` 구성(데이터 보유분만). page.tsx 또는 빌더에서 준비.

## 5. 시각화 (`src/components/sdg/InterlinkageMatrix.tsx`)
- **히트맵**: 행/열=데이터 보유 목표(SDG 픽토그램+번호), 셀=r 색(녹↔무채색↔적, |r| 강도). 호버=「목표 i × 목표 j: r=0.xx (n=N) 시너지/상충」. |r|<0.5는 흐리게.
- (선택) 간단 네트워크(|r|≥0.5 엣지). 과하면 생략, 히트맵 우선.
- 상단 **강한 한계 고지 박스**(D4 전문).
- 위치: `src/app/(ai-society)/sdg/interlinkage/page.tsx` (URL `/sdg/interlinkage`) + `/sdg`·온톨로지에서 진입 링크.

## 6. 검증
- jest: spearman·interlinkageMatrix(위 케이스).
- 컴포넌트: tsc + build + 프리뷰(히트맵 렌더·호버·고지). 콘솔 0.

## 7. 정직성/거버넌스
- 데이터 보유 목표만. 확정 인과/정책효과 주장 0. n·Spearman·Nilsson/IGES 참고 명시. 약한 상관 시각적 약화.
- feat 브랜치 → 리뷰 → 병합.

## 8. 비범위 (후속)
- Nilsson/IGES **문헌 점수 인용 계층**(출처 확보 후).
- 조건부 독립(공통요인 통제) 분석 → 후속(고급).
- 실효성 → D.
