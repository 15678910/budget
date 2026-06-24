# 국제기준 SDG 점수 코어 (A: 목표값 정규화 + 신호등) — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**근거**: SDSN/Bertelsmann SDG Index 방법론, UN Global SDG Indicator Framework, 프랑스/UNESCAP 신호등 임계값. (researcher 조사분 반영)
**대상**: SDG 상황판(`/sdg`) 점수 체계 보강.

---

## 1. 목적
현재 점수(16광역 내 **상대** min-max)에 더해, **목표값 기준 0~100 달성도 점수 + 신호등(Green/Yellow/Orange/Red)**을 추가해 국제기준(SDSN)에 부합시킨다. 상대순위와 목표달성도를 **병행**해 의미를 구분한다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 목표값 출처 | **공식 우선 + 부재 시 명시된 벤치마크/규범** (하이브리드) |
| D2 | 범위 | **점수 코어만** (목표값 정규화 + 신호등). VLR·추세는 후속 |
| D3 | RAW target 처리 | local-sdg-data RAW의 `target`은 **출처 없는 지역 추정값** → **공식으로 사용 금지**(검증 완료). 별도 목표값 데이터셋 구축 |
| D4 | 병행 | 기존 **상대 점수 유지** + **달성도 점수 별도 추가**(두 관점 라벨 구분) |
| D5 | 정직성 | 모든 목표값에 **type('official'|'normative'|'benchmark') + source** 표기. 추정 목표로 '공식 달성도' 단정 금지 |

## 3. 목표값 데이터셋 (`src/lib/sdg/targets-data.ts`)
지표 id별 `{ green: number, floor: number, type: 'official'|'normative'|'benchmark', source: string }`.
- **green threshold(=100점)** 산정 규칙(투명·문서화):
  1. **official**: K-SDGs/UN/국가계획에 명시된 정량 목표가 인용 가능하면 그 값(source에 문서명).
  2. **normative**: 자연 상한/규범이 있는 비율 지표 — 예: 주택보급률·하수처리율·국민연금가입률 → 100(%), 자살률·범죄율·미세먼지 등 lower_better → 보건/환경 규범 기준값(WHO PM2.5 등, source 표기).
  3. **benchmark**: 위 둘 다 없으면 **전국 분포 상위 기준**(예: 16광역 상위 10% 또는 OECD 평균) → type='benchmark', source='국내 분포 상위' 명시.
- **floor(=0점)**: 분포 최저값 또는 규범 하한(0). lower_better는 방향 반영.
- ⚠️ **구현 1번 태스크**: 위 규칙으로 34개 지표(+KOSIS 고용률/GRDP·진학률) 임계값 확정. **official은 실제 인용 가능한 것만**(불확실하면 normative/benchmark로 강등, 날조 금지). 산정 근거를 데이터셋 주석·source에 남김.

## 4. 점수 계산 (`src/lib/sdg/scoring.ts`)
- `scoreTargetBased(value, green, floor, direction)` → 0~100:
  ```
  let t = (value - floor) / (green - floor);
  if (direction === 'lower_better') t = (floor - value) / (floor - green); // green<floor
  return clamp(round(t*100), 0, 100);   // 100 = green threshold 달성
  ```
  (SDSN min-max with green/red anchors. green==floor 방어.)
- `trafficLight(score)` → 'green'|'yellow'|'orange'|'red':
  - **Green ≥75 · Yellow 50~75 · Orange 25~50 · Red <25** (SDSN 대시보드 적응; 점수=목표까지 거리). 임계값 상수화·고지.
- 순수 함수, TDD.

## 5. 적용 (UI)
- **전국 종합 카드**: 달성도 점수 + 신호등 색 배지(+ 기존 절대값 유지).
- **매트릭스 셀**: 상대점수(현행) ↔ **달성도/신호등** 보기 토글(또는 셀 색을 신호등으로 전환하는 모드 스위치).
- **광역 프로파일**: 목표별 달성도 게이지 + 신호등 + "목표값 X (출처/유형)" 표기.
- 상시 고지: "SDSN SDG Index 방법론 기반 달성도 점수 · 목표값 출처·유형 명시 · 상대점수와 구분".

## 6. 검증
- jest `scoring.test.ts`: scoreTargetBased(higher/lower 방향·경계·clamp·green==floor 방어), trafficLight(band 경계).
- `targets-data` 검증 테스트: 모든 지표 항목에 green/floor/type/source 존재(빈 source 0), type∈집합.
- 컴포넌트: tsc + build + 프리뷰(신호등 색·달성도 점수·토글·고지). 콘솔 0.

## 7. 정직성/거버넌스
- 목표값 = 공식 인용 or 규범/벤치마크 **라벨+출처**. RAW 추정 target 미사용(D3). '달성도'는 임계값 유형에 따라 해석 라벨("공식 목표 대비" vs "벤치마크 대비").
- 국제 방법론(SDSN/UN) 인용. 상대점수와 달성도점수 의미 구분 상시 표기.
- feat 브랜치 → 리뷰 → 병합.

## 8. 비범위 (후속)
- **추세 화살표**(↗↘) = 시계열·2030 목표 필요 → B.
- **목표-갭** 외삽 → B.
- **VLR 리포트** → 다음.
- 정책 연계성 → C / 실효성 패널 → D.
