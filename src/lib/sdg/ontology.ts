// SDG 데이터 온톨로지 — 기존 상수에서 파생되는 노드-링크 그래프.
// ⚠️ 손수 노드/엣지를 나열하지 않음. SDG_GOALS·SDG_DOMAINS_5·SDG_DOMAINS·INDICATOR_TO_GOAL에서 전부 도출.
//    NL/AI는 기존 관계를 강조할 뿐 새 관계를 만들지 않음(폐쇄루프 검증은 validateFocus).
import { SDG_GOALS, SDG_DOMAINS_5 } from '@/lib/sdg/goals';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { SDG_DOMAINS } from '@/lib/data/local-sdg-data';

export type OntologyNodeType = 'dataset' | 'indicator' | 'goal' | 'domain';
export type OntologyEdgeKind = 'provides' | 'maps-to' | 'belongs-to';

export interface OntologyNodeMeta {
  unit?: string;
  direction?: string;
  source?: string;
}

export interface OntologyNode {
  id: string;
  type: OntologyNodeType;
  label: string;
  meta?: OntologyNodeMeta;
}

export interface OntologyEdge {
  from: string;
  to: string;
  kind: OntologyEdgeKind;
}

export interface Ontology {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
}

/** source 문자열 표준화(트림 후 내부 공백 단일화) — dataset 고유화 기준 */
function normalizeSource(source: string): string {
  return source.trim().replace(/\s+/g, ' ');
}

/** dataset 노드 id 생성 (표준화된 source 기준) */
function datasetId(source: string): string {
  return `ds-${normalizeSource(source)}`;
}

/**
 * 기존 상수에서 4계층 온톨로지(dataset → indicator → goal → domain)를 파생한다.
 * 순수 함수, 정적 import만 사용. 호출마다 동일 결과(결정론).
 */
export function buildOntology(): Ontology {
  const nodes: OntologyNode[] = [];
  const edges: OntologyEdge[] = [];

  // ── goal 노드 (17) ──
  for (const g of SDG_GOALS) {
    nodes.push({ id: `goal-${g.num}`, type: 'goal', label: g.name });
  }

  // ── domain 노드 (5대 영역) ──
  for (const d of SDG_DOMAINS_5) {
    nodes.push({ id: `domain-${d.id}`, type: 'domain', label: d.label });
  }

  // ── indicator 노드 (SDG_DOMAINS의 모든 지표) + dataset source 수집 ──
  const datasetSources = new Set<string>();
  for (const domain of SDG_DOMAINS) {
    for (const ind of domain.indicators) {
      nodes.push({
        id: `ind-${ind.id}`,
        type: 'indicator',
        label: ind.name,
        meta: { unit: ind.unit, direction: ind.direction, source: ind.source },
      });
      const normalized = normalizeSource(ind.source);
      if (normalized) datasetSources.add(normalized);
    }
  }

  // ── dataset 노드 (source 고유값) ──
  for (const source of datasetSources) {
    nodes.push({ id: `ds-${source}`, type: 'dataset', label: source });
  }

  // ── provides 엣지: dataset → indicator ──
  for (const domain of SDG_DOMAINS) {
    for (const ind of domain.indicators) {
      const normalized = normalizeSource(ind.source);
      if (!normalized) continue;
      edges.push({ from: datasetId(ind.source), to: `ind-${ind.id}`, kind: 'provides' });
    }
  }

  // ── maps-to 엣지: indicator → goal (INDICATOR_TO_GOAL에 있는 지표만) ──
  for (const [indId, goalNum] of Object.entries(INDICATOR_TO_GOAL)) {
    edges.push({ from: `ind-${indId}`, to: `goal-${goalNum}`, kind: 'maps-to' });
  }

  // ── belongs-to 엣지: goal → domain ──
  for (const d of SDG_DOMAINS_5) {
    for (const goalNum of d.goals) {
      edges.push({ from: `goal-${goalNum}`, to: `domain-${d.id}`, kind: 'belongs-to' });
    }
  }

  return { nodes, edges };
}

/**
 * 폐쇄루프 검증: 입력 id 중 온톨로지에 실재하는 노드 id만 반환(나머지 폐기).
 * NL/AI가 고른 id를 렌더 전 통과시켜 관계 날조를 원천 차단한다.
 */
export function validateFocus(ids: string[]): string[] {
  const valid = new Set(buildOntology().nodes.map((n) => n.id));
  return ids.filter((id) => valid.has(id));
}

/** 노드 요약(id·label·type) — Gemini에 전달할 compact 컨텍스트용 */
export function ontologyNodeSummary(): { id: string; label: string; type: OntologyNodeType }[] {
  return buildOntology().nodes.map((n) => ({ id: n.id, label: n.label, type: n.type }));
}

/** 한 노드에 직접 연결된 이웃 목록(양방향, 중복 제거). 엣지 종류 동반. */
export interface OntologyNeighbor {
  nodeId: string;
  edgeKind: OntologyEdgeKind;
}

/**
 * nodeId에 직접 연결된 이웃을 반환한다(무방향: from/to 양쪽 모두 탐색).
 * 동일 이웃이 여러 엣지로 연결돼도 한 번만 등장(첫 엣지 종류 유지).
 */
export function neighbors(edges: OntologyEdge[], nodeId: string): OntologyNeighbor[] {
  const result: OntologyNeighbor[] = [];
  const seen = new Set<string>();
  for (const e of edges) {
    let other: string | null = null;
    if (e.from === nodeId) other = e.to;
    else if (e.to === nodeId) other = e.from;
    if (other === null || seen.has(other)) continue;
    seen.add(other);
    result.push({ nodeId: other, edgeKind: e.kind });
  }
  return result;
}

/**
 * from→to 최단 경로(무방향 BFS) 노드 id 배열을 반환한다.
 * 경로 없으면 [], from===to면 [from]. 첫 발견 경로(최단)를 반환.
 */
export function shortestPath(edges: OntologyEdge[], from: string, to: string): string[] {
  if (from === to) return [from];

  // 무방향 인접 리스트
  const adj = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  };
  for (const e of edges) {
    link(e.from, e.to);
    link(e.to, e.from);
  }

  const queue: string[] = [from];
  const prev = new Map<string, string | null>([[from, null]]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === to) {
      // 역추적
      const path: string[] = [];
      let step: string | null = to;
      while (step !== null) {
        path.push(step);
        step = prev.get(step) ?? null;
      }
      return path.reverse();
    }
    for (const next of adj.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      queue.push(next);
    }
  }

  return [];
}

/** 온톨로지 규모 카운트(엔티티=노드수, 관계=엣지수, 속성=모든 노드 meta 키 총합). */
export interface OntologyCounts {
  entities: number;
  relationships: number;
  properties: number;
}

export function ontologyCounts(ontology: Ontology): OntologyCounts {
  let properties = 0;
  for (const n of ontology.nodes) {
    if (n.meta) properties += Object.keys(n.meta).length;
  }
  return {
    entities: ontology.nodes.length,
    relationships: ontology.edges.length,
    properties,
  };
}
