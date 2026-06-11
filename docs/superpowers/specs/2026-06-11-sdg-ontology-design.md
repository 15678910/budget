# SDG 온톨로지 관계 다이어그램 (B) — 설계 명세

**작성일**: 2026-06-11
**상태**: 설계 확정 (구현 대기)
**순서**: A(가독성 재설계, 배포 완료) → **B(본 문서)** → C(인터랙티브 what-if/최적값)
**영감**: Palantir AI FDE — 온톨로지 중심 + 폐쇄루프 검증 + 최소문맥 + 검증된 NL 작업변환

---

## 1. 목적
SDG 상황판의 **데이터 생태계(데이터셋·지표·목표·영역의 관계)**를 노드-링크 그래프로 시각화해, 사용자가 "무엇이 무엇으로 연결되는지" 쉽게 이해하게 한다. 사용자는 자연어 명령("재정과 SDG 관계만 보여줘")으로 그래프를 포커스할 수 있다.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 온톨로지 출처 | **기존 상수에서 파생**(SDG_GOALS·INDICATOR_TO_GOAL·SDG_DOMAINS·SDG_DOMAINS_5) — 손수 유지 X, 자동 동기화 |
| D2 | 렌더 | **d3-force** 노드-링크(이미 의존성 보유), SVG. 노드색=타입, 드래그·줌·클릭 이웃 강조 |
| D3 | 포커스 | ①노드 클릭 ②카테고리 필터 칩 ③**NL 명령창(Gemini)** |
| D4 | NL 검증 | **폐쇄루프**: Gemini가 고른 id를 렌더 전 온톨로지 존재 여부로 필터 → 없는 id 폐기(관계 날조 0). NL은 강조/필터만, 관계 추가 불가 |
| D5 | 위치 | `/sdg/ontology` 별도 라우트 |

## 3. 온톨로지 모델 (`src/lib/sdg/ontology.ts`)
4계층 파생 그래프:
- **노드 타입**:
  - `dataset` — 지표들의 `source` 고유값(KOSIS·지역재정365·환경부·경찰청·보건복지부·국토교통부·문체부·통계청·교육부 등) + 진학률 출처
  - `indicator` — SDG_DOMAINS 34지표 + KOSIS 고용률·GRDP + 진학률
  - `goal` — 17 SDG 목표
  - `domain` — 5대 영역(인간·지구·번영·평화·파트너십)
- **엣지(kind)**:
  - `provides`: dataset → indicator (indicator.source 기준)
  - `maps-to`: indicator → goal (INDICATOR_TO_GOAL 기준). **매핑 없는 지표(fin_*·dem_*)는 maps-to 없음** → 그래프에 '목표 미연결' 맥락 노드로 정직 표시
  - `belongs-to`: goal → domain (SDG_DOMAINS_5)
- `buildOntology()` → `{ nodes: {id,type,label,meta}[], edges: {from,to,kind}[] }`. 순수 함수, 정적 import만.

## 4. 컴포넌트
| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `src/lib/sdg/ontology.ts` | `buildOntology()` 파생 + `validateFocus(ids)` (존재 id만) | 신규 |
| `src/components/sdg/OntologyGraph.tsx` | d3-force 렌더(노드/엣지/드래그/줌/클릭 이웃강조) | 신규 |
| `src/components/sdg/OntologyView.tsx` | 컨테이너: 그래프 + 카테고리 필터 칩 + 명령창 + 범례 + 고지 | 신규 |
| `src/app/sdg/ontology/page.tsx` | 라우트, buildOntology 주입 | 신규 |
| `src/app/api/sdg/ontology-focus/route.ts` | POST{query}→Gemini→검증된 `{focusNodeIds}` | 신규 |

## 5. NL 포커스 API (폐쇄루프)
- `POST /api/sdg/ontology-focus` body `{query, ontologySummary}`.
- 서버: Gemini에 **온톨로지 요약(노드 id·label·type 목록, compact)** + query 전달 → JSON `{focusNodeIds: string[]}` 응답(스키마 강제, temperature 0).
- **검증**: 반환 id를 `buildOntology()` 노드 id 집합과 교집합만 통과(`validateFocus`). 빈 결과면 키워드 매칭 fallback.
- 가드: `checkGeminiRateLimit()`+`markGeminiCall()`, 캐시(query→ids, 10분 TTL, 100건), 타임아웃, 429 fallback (CLAUDE.md Gemini 규칙 준수).
- 응답에 "정의된 관계만 강조 · 신규 관계 생성 아님" 메타.

## 6. 데이터 흐름
- 서버: `buildOntology()`(정적)→ OntologyView에 nodes/edges 주입.
- 수동 포커스: 클라이언트(클릭/필터 칩) — 결정론, API 불필요.
- NL 포커스: 클라 POST → API(Gemini, 서버) → 검증 id → 클라 강조.

## 7. 검증
- jest `ontology.test.ts`:
  - 모든 `maps-to` 엣지가 INDICATOR_TO_GOAL과 1:1 일치, 고아 엣지(존재 안 하는 노드 참조) 0.
  - fin_*/dem_* 지표는 maps-to 엣지 없음(목표 미연결) 확인.
  - `validateFocus(['goal-1','FAKE'])` → ['goal-1']만(가짜 폐기).
- 컴포넌트: tsc + next build + 브라우저 프리뷰(그래프 렌더, 노드 클릭 강조, 카테고리 필터, 명령창 입력→포커스). 콘솔 0.
- 보안: API는 인증 영역(유지보수 모드 내 관리자) — auth 변경 없음. Gemini 입력에 사용자 데이터 미포함(온톨로지 구조만).

## 8. 비범위 (YAGNI / 후속)
- scope/budget 노드 계층 확장(v1은 dataset·indicator·goal·domain 4계층) → 후속.
- 그래프에서 직접 편집/액션 실행(AI FDE 풀 기능) → 우리는 읽기 전용 시각화만(YAGNI).
- 인터랙티브 what-if → C.

## 9. 리스크
| 리스크 | 대응 |
|--------|------|
| 노드 과다(34지표+출처+17목표)로 그래프 혼잡 | 카테고리 필터 기본 적용·이웃 강조·force 파라미터 튜닝. 기본 뷰는 영역별 군집 |
| Gemini 할루시네이션(없는 관계) | D4 폐쇄루프 검증으로 원천 차단 |
| Gemini 비용/한도 | 캐시+레이트리밋+fallback. NL은 선택 기능(수동 포커스로도 완전 동작) |
| dataset 노드가 source 문자열 다양성에 의존 | source 정규화(트림/표준화) 후 고유화 |

## 10. 정직성 / 거버넌스 (AI FDE 정렬)
- 그래프는 **코드에 정의된 관계만** 표시(파생). NL은 강조/필터만.
- 모든 화면 고지: "정의된 데이터셋·지표·목표 관계도이며, AI는 기존 관계를 강조할 뿐 새 관계를 만들지 않습니다."
- 변경 거버넌스: 기존대로 feat 브랜치 → 리뷰 → 병합.
