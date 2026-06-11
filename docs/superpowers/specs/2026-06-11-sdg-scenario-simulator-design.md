# SDG 시나리오 시뮬레이터 (C: 인터랙티브 what-if + 목표 힌트) — 설계 명세

**작성일**: 2026-06-11
**상태**: 설계 확정 (구현 대기)
**순서**: A(가독성, 배포완료) → B(온톨로지, 배포완료) → **C(본 문서)**
**영감**: Palantir AI FDE — 브랜칭(=시나리오 오버레이) + 미리보기/델타 + 폐쇄루프

---

## 1. 목적
사용자가 광역의 지표값을 직접 조정하며 **"이 값을 바꾸면 SDG 점수·순위가 어떻게 변하나"**를 탐색하고, **목표 도달에 필요한 값**을 찾아 자신의 최적값을 얻게 한다. 실데이터는 절대 변경하지 않는 **가정(시나리오) 레이어**로만 동작.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 핵심 동작 | **광역 지표 슬라이더 → 정규화 점수·16광역 순위 재계산** |
| D2 | 최적값 지원 | **자유 탐색 + 목표 도달 힌트**(min-max 투명 역산) |
| D3 | 데이터 안전 | 시나리오 = **가정 오버레이, 미저장·실데이터 불변**, "가정값" 명확 표기 |
| D4 | 재계산 엔진 | **기존 파이프라인 재사용**(region-normalize→indicator-map→matrix) — 일관성 |
| D5 | 위치 | `/sdg` 광역 프로파일에 **'what-if 시뮬레이터' 토글** (별도 라우트 X) |

## 3. 동작 흐름
1. 광역 선택(스코프=광역) → 프로파일에 'what-if' 토글 → 데이터 보유 지표 슬라이더(baseline=실값, 단위·방향 표기).
2. 슬라이더 조정 → 그 지표의 **16광역 값 분포에 override 반영 후 재정규화** → 해당 목표 시나리오 점수 + 순위.
3. **baseline 대비 Δ**: "Goal8 59→72 (+13), 순위 8→3위" 형태.
4. **목표 힌트(역산)**: "Goal8 top-3(또는 점수 X) 도달에 필요한 고용률 ≥ Y%". min-max 역산: targetScore→필요 정규화값→원시값(direction 반영, 다른 15광역 고정 가정).
5. **리셋** 버튼, 상단 "가정 시나리오 — 실제 데이터 아님" 배너.

## 4. 컴포넌트 / 모듈
| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `src/lib/sdg/scenario.ts` | `applyScenario()`·`targetHint()` 순수 계산 | 신규 |
| `src/components/sdg/SDGScenarioSimulator.tsx` | 지표 슬라이더 + Δ/순위 + 힌트 + 리셋 + 배너 | 신규 |
| `src/components/sdg/SDGRegionProfile.tsx` | 'what-if' 토글로 시뮬레이터 진입 | 수정 |
| `src/lib/sdg/__tests__/scenario.test.ts` | TDD | 신규 |

### 4.1 scenario.ts API
- `applyScenario(baseValuesByIndicator, overrides, metro, goalIndicatorIds, direction)` → `{ score: number, rankAmong16: number }`. overrides를 해당 지표 열에 머지 → `normalizeMinMax` 재실행 → goal 지표 평균 → metro 점수 + 순위.
- `targetHint(baseValuesByIndicator, metro, indicatorId, direction, targetScore)` → `{ requiredValue: number, achievable: boolean }`. min-max 역산: 다른 15광역 고정, metro 값만 변화시켜 targetScore(0~100) 달성에 필요한 원시값. 분포 밖(목표>달성가능)이면 `achievable:false`.
- 순수 함수, 정적 import만(클라이언트 호출 가능).

## 5. 데이터 흐름
- baseline `valuesByIndicator`(기존 board-data 산출, 16광역 실값)를 prop으로 전달.
- 슬라이더 override = 클라이언트 상태 `Record<indicatorId, number>`(선택 metro 한정). baseline에서 시작, 리셋 시 비움.
- 재계산 = 클라이언트(순수 scenario.ts), API 불필요.
- **저장 없음**: override는 컴포넌트 상태로만. 새로고침 시 baseline 복귀.

## 6. 정직성 / 거버넌스 (AI FDE 브랜칭)
- 시나리오는 **가정 레이어**: 실데이터·매트릭스·전국값에 미반영, 미저장. UI에 "가정값(실데이터 아님)" 상시 배너.
- 한 광역 값 변경이 그 지표 분포를 바꿔 **다른 광역 순위도 영향** → 상대점수의 본질이므로 정직하게 반영(숨기지 않음).
- 목표 힌트 = **투명한 min-max 역산**(블랙박스 solver 아님), "다른 지역 고정 가정" 명시.
- 다지표 목표: 지표별 "이 지표 조정 시(나머지 고정)" 힌트로 분리.

## 7. 검증
- jest `scenario.test.ts`:
  - applyScenario: override 후 점수·순위가 수동 계산과 일치(작은 케이스).
  - targetHint: 반환 requiredValue를 다시 applyScenario에 넣으면 targetScore와 ±1 오차 내 일치(역산 정합).
  - 경계: targetScore=100인데 분포상 달성 불가면 achievable:false.
  - 다른 광역 미override 시 baseline 점수와 동일(무변경 항등).
- 컴포넌트: tsc + next build + 프리뷰(슬라이더→Δ/순위 실시간, 힌트, 리셋, 배너). 콘솔 0.

## 8. 비범위 (YAGNI)
- 예산 배분 what-if(SDG-예산 인과모델 없음 → 날조 위험) → 영구 제외.
- 자동 최적화 solver(다목적 목적함수) → 제외(거짓 정밀).
- 시나리오 저장/공유 → 후속(필요 시).
- 기초 시군구 what-if → 후속(실데이터 희소).

## 9. 리스크
| 리스크 | 대응 |
|--------|------|
| 시나리오가 실데이터로 오인 | 상시 배너 + "가정값" 라벨 + 미저장 |
| 다지표 목표 역산 모호 | 지표별 단일 역산(나머지 고정) + 명시 |
| 분포 경계(목표 달성 불가) | achievable:false + "현 분포에서 도달 불가" 안내 |
| min-max 재정규화로 타 지역 순위 변동 혼동 | "상대 점수: 한 지역 변경이 전체 순위에 영향" 1줄 설명 |

## 10. 추가 작업 (번들)
- `/sdg` 상황판에 **'온톨로지 관계도'(/sdg/ontology) 링크 추가**(B 발견성). 동일 브랜치·배포에 포함.
