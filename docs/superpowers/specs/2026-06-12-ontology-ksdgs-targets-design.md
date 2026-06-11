# 온톨로지 K-SDGs 세부목표 보강 (A단계) — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**대상**: `/sdg/ontology` 데이터 보강 (B+ 확장). 출처: 지속가능발전포털 ncsd.go.kr (K-SDGs), UN(후속).
**선행**: B+(온톨로지 Playground, 배포완료)

---

## 1. 목적
온톨로지에 **K-SDGs 17목표·119세부목표** 계층을 더해 `데이터셋→지표→목표→세부목표` 위계를 완성하고, 한국형 SDG 체계의 전문성·정합성을 부여한다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 프레임워크 | **K-SDGs 먼저** (UN 169는 B단계 참조 계층) |
| D2 | 수집 | **1회 수집 스크립트 → 정적 JSON**(런타임 스크래핑 X), 출처표기·검수 |
| D3 | 그래프 클러터 | 세부목표는 **INSPECTOR 기본 표시**, 그래프 노드는 **토글(기본 OFF)** |
| D4 | 정직성 | **공식 K-SDGs 실데이터만**. 못 구하면 **날조 금지 → 보고**(가짜 세부목표 생성 절대 금지) |

## 3. 데이터 수집 (`scripts/fetch-ksdgs.mjs`)
- **수집 전 `https://www.ncsd.go.kr/robots.txt` + 이용약관 확인** → 수집 허용 여부 판단(불허 시 중단·보고).
- `/ksdgs/goals`(및 목표별 상세 경로) 수집. **주의**: gov SPA라 HTML이 JS 렌더면 fetch로 빈 결과 → (1) 페이지 소스/네트워크에서 **데이터 endpoint(JSON API)** 탐색, (2) 있으면 사용, (3) 정적 HTML이면 파싱.
- 산출: `public/data/ksdgs.json` =
  ```
  { collectedAt, source: 'ncsd.go.kr', goals: { "1": { num, title, targets: [{ code, text }] }, … "17": … } }
  ```
- **검수**: 목표 17개, 세부목표 총수(공식 119 근사) 확인, 샘플 텍스트 육안 검증. 수치·텍스트가 공식과 다르면 보고.
- ⚠️ **실데이터 확보 불가 시(JS-only·접근불가·약관불허)**: 가짜 데이터 생성 금지. `BLOCKED/NEEDS_CONTEXT`로 보고하고, 사용자에게 공식 K-SDGs 자료 제공 또는 수동 전사 승인을 요청.

## 4. 온톨로지 통합 (`src/lib/sdg/ontology.ts` 확장)
- `buildOntology()`가 `ksdgs.json`을 읽어(또는 인자로 받아) 세부목표를 goal에 연결.
- K-SDGs 목표 번호 1–17 = 기존 `goal-${num}` 노드 재사용. 세부목표 = `target-${code}`.
- 엣지 `has-target`: `goal-${num} → target-${code}`.
- `getTargets(goalNum)` → 그 목표의 세부목표 배열(INSPECTOR·토글용).
- 그래프 기본 노드 집합에는 **target 미포함**(D3). 토글 시 선택 goal의 target만 추가.
- `ontologyCounts`에 targets 수 반영(별도 필드 `targets`).

## 5. UI (`OntologyView`/`OntologyInspector`/`OntologyGraph` 수정)
- **INSPECTOR**: goal 노드 선택 시 K-SDGs 세부목표 목록(코드+텍스트) 섹션 추가(출처 ncsd 표기).
- **토글 "세부목표 노드 표시"**: ON + goal 선택 시 그 goal의 target 노드를 그래프에 확장(전체 119 동시 표시 금지 — 선택 goal 한정).
- **INSIGHTS**: "세부목표 N" 카운트 추가. 범례/필터에 target 타입(색상).
- 고지: "K-SDGs 세부목표(출처: 지속가능발전포털 ncsd.go.kr)".

## 6. 검증
- jest: `getTargets`(goal별 반환), buildOntology에 has-target 엣지가 ksdgs.json과 일치, target 노드 id 유일성, 기본 그래프에 target 미포함.
- 컴포넌트: tsc + build + 프리뷰(INSPECTOR 세부목표 표시, 토글 시 target 노드 확장, INSIGHTS 카운트). 콘솔 0.
- 데이터: ksdgs.json 목표 17 + 세부목표 수 검증.

## 7. 정직성/거버넌스
- 정적 JSON = 공식 K-SDGs만, 출처·수집일 표기. 날조 0(D4). robots/약관 준수.
- 변경 거버넌스: feat 브랜치 → 리뷰 → 병합.

## 8. 비범위 (후속)
- **B단계**: 국가/지방 기본전략·보고서 = **문서 노드(메타+링크)**, UN 169 = 참조 계층.
- 지표↔세부목표 정밀 매핑(현재는 goal↔target) → 후속.
- K-SDGs 지표(236) 전체 노드화 → 후속(우선 세부목표까지).
