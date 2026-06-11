# SDG 온톨로지 Playground 고도화 (B+) — 설계 명세

**작성일**: 2026-06-11
**상태**: 설계 확정 (구현 대기)
**선행**: B(온톨로지 관계도, 배포완료) 확장. Microsoft "Ontology Playground" UX 참조.
**대상**: `/sdg/ontology` 강화 (신규 라우트 아님)

---

## 1. 목적
기존 `/sdg/ontology`(d3-force 그래프 + 필터 + NL 포커스)에 Playground 수준의 **탐색·검사 기능**을 더해 데이터 관계를 깊이 이해하게 한다.

## 2. 추가 기능 (확정)
| # | 기능 | 현재 | 추가 |
|---|------|------|------|
| F1 | **엣지 라벨** | 선만 | provides·maps-to·belongs-to 라벨 표시 |
| F2 | **범례** | 필터 칩 | 4타입 색상 범례(상시) |
| F3 | **INSIGHTS 카운트** | 없음 | 엔티티/관계/속성 수 패널 |
| F4 | **INSPECTOR 패널** | 이웃 강조만 | 노드 클릭 → 우측 상세(타입·label·메타(출처/단위/방향)·연결 노드·관계 목록) |
| F5 | **PATH FINDER** | 없음 | 두 노드 선택 → 최단 경로 강조 |
| F6 | **줌/팬/리셋/내보내기** | 약함 | 줌 버튼·팬·리셋·PNG 내보내기 |
| (유지) | NL 포커스, 카테고리 필터 | ✅ | 그대로 |

## 3. 모듈/컴포넌트
| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `src/lib/sdg/ontology.ts` | `neighbors(id)`, `shortestPath(a,b)`(BFS), `ontologyCounts()`(엔티티/관계/속성 수) 추가 | 수정 |
| `src/components/sdg/OntologyGraph.tsx` | 엣지 라벨, 줌/팬/리셋/export, path 강조 | 수정 |
| `src/components/sdg/OntologyView.tsx` | INSIGHTS·INSPECTOR·PATH FINDER·범례 패널 추가(우측), 레이아웃 재구성 | 수정 |
| `src/components/sdg/OntologyInspector.tsx` | 노드 상세 패널(분리, 300줄 관리) | 신규 |
| `src/lib/sdg/__tests__/ontology.test.ts` | neighbors·shortestPath·counts TDD 추가 | 수정 |

### 3.1 ontology.ts 추가 API
- `neighbors(edges, nodeId)` → `{nodeId, edgeKind}[]` (양방향 직접 연결).
- `shortestPath(edges, from, to)` → `string[]`(노드 id 경로) 또는 `[]`(경로 없음). BFS, 무방향.
- `ontologyCounts(o)` → `{entities, relationships, properties}`. entities=노드수, relationships=엣지수, properties=노드 meta 키 총합.
- 전부 순수 함수, TDD.

## 4. 레이아웃 (Playground 참조)
```
┌──────────────────────────────┬───────────────┐
│ [줌+][줌-][리셋][PNG]           │ INSIGHTS       │
│                              │ 엔티티 N·관계 M·│
│   d3-force 그래프 (엣지 라벨)    │ 속성 P         │
│   클릭→INSPECTOR, 경로 강조     │ ───────────── │
│                              │ PATH FINDER    │
│ [범례: dataset·indicator·     │ from▼ to▼ 찾기  │
│  goal·domain]                │ ───────────── │
│ [명령창(NL) | 카테고리 필터]     │ INSPECTOR      │
│                              │ (선택 노드 상세) │
└──────────────────────────────┴───────────────┘
```

## 5. 동작
- 노드 클릭 → INSPECTOR에 타입·label·메타·연결노드(neighbors)·관계종류 표시 + 그래프 이웃 강조.
- PATH FINDER: from/to 드롭다운(노드) 선택 → `shortestPath` → 경로 노드·엣지 강조 + "경로 없음" 처리.
- 줌/팬: SVG transform(스케일·translate), 리셋 버튼. PNG 내보내기: SVG→canvas→download(기존 html2canvas 금지 규칙 무관, SVG 직렬화 방식).
- 엣지 라벨: 엣지 중점에 작은 텍스트(provides/매핑/소속). 혼잡 시 hover/focus 시만 표시 옵션.

## 6. 검증
- jest: `neighbors`(양방향), `shortestPath`(존재/없음/자기자신), `ontologyCounts`(정확).
- 컴포넌트: tsc + build + 프리뷰(클릭→INSPECTOR, PATH FINDER 경로 강조, 줌/리셋, PNG 다운로드, 엣지 라벨). 콘솔 0.

## 7. 정직성
- 그래프·관계는 기존 파생 온톨로지(코드 정의)만. INSPECTOR 메타도 실제 데이터(출처/단위/방향)만. NL은 강조만(B와 동일). 새 관계 생성 없음.

## 8. 비범위 (YAGNI)
- Playground의 QUESTS(게임화) → 공공 도구엔 불필요.
- 그래프 직접 편집/온톨로지 수정 → 읽기 전용 유지.
- scope/budget 노드 계층 확장 → 후속.
