# UN 169 세부목표 국제 참조 계층 — 설계 명세

**작성일**: 2026-06-25
**상태**: 설계 확정 (구현 대기)
**근거**: UN 공식 SDG 세부목표(A/RES/70/1, UN Statistics Division SDG API). K-SDGs(국문 한국 적용본) 위에 **국제 원본 참조 계층** 추가.

---

## 1. 목적
온톨로지 INSPECTOR에서 각 SDG 목표에 대해 **국제 표준 UN 169 세부목표(공식 영문)** 를 **K-SDGs(국문 한국 적용본)와 나란히** 보여 "한국화 vs 국제 원본"을 비교한다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 출처 | **UN Statistics Division SDG API** `Target/List` (검증 완료, 169개·목표1~17) |
| D2 | 언어 | **공식 영문(축자) + 비공식 국문 참고 번역 병기**(원문 항상 표시) |
| D3 | 표현 | INSPECTOR에서 **K-SDGs ↔ UN 169 나란히** 비교. 그래프 노드 확장은 토글(기본 OFF) |
| D4 | 정직성 | 영문=공식 인용(축자, 날조 0). 국문="비공식 참고 번역" 라벨. source·fetchedAt 표기 |

## 3. 수집 (`scripts/fetch-un-targets.mjs`)
- `GET https://unstats.un.org/sdgapi/v1/sdg/Target/List?includechildren=false` → 169개 평면 배열(각 `{goal, code, title, description}`).
- 정규화: `{ goal:number, code:string, en:string }`(en=title, 축자). 목표별 그룹화.
- **안전 실패**: 총 169개 아니거나 목표 1~17 누락이면 `exit 2`(부분/날조 방지). 빈 응답 시 기존 파일 보존.
- 출력 `public/data/un-targets.json`: `{ source: "UN Statistics Division SDG API (A/RES/70/1)", url, fetchedAt, goals: { "1":[{code,en,ko}], … "17":[…] } }`.
- **국문 `ko`**: 구현 시 공식 영문의 **정확한 비공식 참고 번역**을 채움(원문 영문 항상 병기, UI에서 "비공식" 라벨). 영문이 권위 데이터.

## 4. 라이브러리 (`src/lib/sdg/ontology.ts` 또는 신규 `un-targets.ts`)
- `getUNTargets(goal:number)` → `{code,en,ko}[]`. ksdgs.json 로드 패턴 재사용.
- (선택) `un-target` 노드 타입 + 토글 확장(K-SDGs target 토글과 동일 메커니즘, 가독성 위해 기본 OFF).
- ontologyCounts에 UN 169 합산(또는 별도 카운트).

## 5. UI (`OntologyInspector` 확장)
- 목표 노드 선택 시 INSPECTOR에 **2단**: 「K-SDGs 세부목표(국문·한국 적용)」 + 「UN 169 세부목표(국제 기준)」.
- UN 항목: `code` + 영문 원문 + 그 아래 작은 국문(비공식). 출처 배지("UN SDG API · 영문 공식 · 국문 비공식").
- INSIGHTS 카운터: "UN 169 세부목표" 추가.
- 컴포넌트 300줄↓(초과 시 UN 섹션 분리).

## 6. 검증
- 스크립트 실제 실행 → 169개·목표1~17 확인.
- jest: `getUNTargets`(목표별 개수>0·code `^\d+\.` 형식), un-targets.json 무결(169·17목표·source 존재).
- 컴포넌트: tsc + build + 프리뷰(INSPECTOR K-SDGs/UN 병기·출처 배지·국문 비공식 라벨). 콘솔 0.

## 7. 정직성/거버넌스
- 영문=UN 공식 축자(API·A/RES/70/1 인용). 국문=비공식 참고 번역 명시 + 원문 병기. K-SDGs=한국 적용본 / UN 169=국제 원본 구분.
- feat 브랜치 → 코드리뷰 → 병합.

## 8. 비범위 (후속)
- UN 247 지표 계층 → 후속.
- 공식 국문 정식 번역(외교부/통계청 확보 시 `ko` 교체) → 후속.
- 그래프 전면 UN 노드 상시 표시 → 토글 유지(가독성).
