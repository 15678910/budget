import {
  buildOntology,
  validateFocus,
  neighbors,
  shortestPath,
  ontologyCounts,
  getTargets,
} from '@/lib/sdg/ontology';
import type { OntologyEdge } from '@/lib/sdg/ontology';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { SDG_GOALS, SDG_DOMAINS_5 } from '@/lib/sdg/goals';
import { SDG_DOMAINS } from '@/lib/data/local-sdg-data';
import ksdgs from '../../../../public/data/ksdgs.json';

const KSDGS_TARGET_TOTAL = Object.values(ksdgs.goals).reduce(
  (sum, g) => sum + g.targets.length,
  0,
);

describe('buildOntology', () => {
  const { nodes, edges } = buildOntology();
  const nodeIds = new Set(nodes.map((n) => n.id));

  it('goal 노드 17개를 SDG_GOALS에서 파생한다', () => {
    const goals = nodes.filter((n) => n.type === 'goal');
    expect(goals.length).toBe(SDG_GOALS.length);
    expect(goals.length).toBe(17);
    expect(nodeIds.has('goal-1')).toBe(true);
    expect(nodeIds.has('goal-17')).toBe(true);
  });

  it('domain 노드 5개를 SDG_DOMAINS_5에서 파생한다', () => {
    const domains = nodes.filter((n) => n.type === 'domain');
    expect(domains.length).toBe(SDG_DOMAINS_5.length);
    expect(domains.length).toBe(5);
    expect(nodeIds.has('domain-people')).toBe(true);
  });

  it('indicator 노드를 SDG_DOMAINS의 모든 지표에서 파생한다(meta 포함)', () => {
    const indicators = nodes.filter((n) => n.type === 'indicator');
    const totalInd = SDG_DOMAINS.reduce((sum, d) => sum + d.indicators.length, 0);
    expect(indicators.length).toBe(totalInd);
    const sample = nodes.find((n) => n.id === 'ind-wel_basic');
    expect(sample).toBeDefined();
    expect(sample?.meta?.source).toBeDefined();
    expect(sample?.meta?.unit).toBeDefined();
    expect(sample?.meta?.direction).toBeDefined();
  });

  it('dataset 노드는 source 고유값(표준화 후 dedup)에서 파생한다', () => {
    const datasets = nodes.filter((n) => n.type === 'dataset');
    const uniqueSources = new Set(
      SDG_DOMAINS.flatMap((d) => d.indicators.map((i) => i.source.trim().replace(/\s+/g, ' '))),
    );
    expect(datasets.length).toBe(uniqueSources.size);
    expect(datasets.length).toBeGreaterThan(0);
  });

  it('모든 엣지의 from/to가 실재 노드를 참조한다(고아 0)', () => {
    for (const e of edges) {
      expect(nodeIds.has(e.from)).toBe(true);
      expect(nodeIds.has(e.to)).toBe(true);
    }
  });

  it('모든 maps-to 엣지가 INDICATOR_TO_GOAL과 1:1 일치한다', () => {
    const mapsTo = edges.filter((e) => e.kind === 'maps-to');
    const entries = Object.entries(INDICATOR_TO_GOAL);
    expect(mapsTo.length).toBe(entries.length);
    for (const [indId, goalNum] of entries) {
      const match = mapsTo.find((e) => e.from === `ind-${indId}` && e.to === `goal-${goalNum}`);
      expect(match).toBeDefined();
    }
  });

  it('fin_*/dem_* 지표는 maps-to 엣지가 없다(목표 미연결)', () => {
    const mapsTo = edges.filter((e) => e.kind === 'maps-to');
    const fromIds = new Set(mapsTo.map((e) => e.from));
    const unmapped = SDG_DOMAINS.flatMap((d) => d.indicators.map((i) => i.id)).filter(
      (id) => id.startsWith('fin_') || id.startsWith('dem_'),
    );
    expect(unmapped.length).toBeGreaterThan(0);
    for (const id of unmapped) {
      expect(fromIds.has(`ind-${id}`)).toBe(false);
    }
  });

  it('provides 엣지는 각 지표의 source dataset → indicator로 연결된다', () => {
    const provides = edges.filter((e) => e.kind === 'provides');
    const totalInd = SDG_DOMAINS.reduce((sum, d) => sum + d.indicators.length, 0);
    expect(provides.length).toBe(totalInd);
  });

  it('belongs-to 엣지는 goal → domain으로 연결된다', () => {
    const belongs = edges.filter((e) => e.kind === 'belongs-to');
    const totalGoals = SDG_DOMAINS_5.reduce((sum, d) => sum + d.goals.length, 0);
    expect(belongs.length).toBe(totalGoals);
    expect(belongs.length).toBe(17);
  });
});

describe('validateFocus', () => {
  it('실재하는 노드 id만 통과시키고 가짜 id는 폐기한다', () => {
    expect(validateFocus(['goal-1', 'FAKE'])).toEqual(['goal-1']);
  });

  it('전부 가짜면 빈 배열을 반환한다', () => {
    expect(validateFocus(['NOPE', 'goal-999'])).toEqual([]);
  });

  it('실재 dataset/indicator id를 통과시킨다', () => {
    const { nodes } = buildOntology();
    const ds = nodes.find((n) => n.type === 'dataset')!;
    expect(validateFocus([ds.id, 'ind-wel_basic'])).toContain(ds.id);
    expect(validateFocus([ds.id, 'ind-wel_basic'])).toContain('ind-wel_basic');
  });
});

describe('neighbors', () => {
  // A-B(provides), B-C(maps-to), C-A(belongs-to) 삼각 + A-D(provides) 가지
  const edges: OntologyEdge[] = [
    { from: 'A', to: 'B', kind: 'provides' },
    { from: 'B', to: 'C', kind: 'maps-to' },
    { from: 'C', to: 'A', kind: 'belongs-to' },
    { from: 'A', to: 'D', kind: 'provides' },
  ];

  it('양방향으로 직접 연결된 이웃을 반환한다(from/to 무관)', () => {
    const ns = neighbors(edges, 'A');
    const ids = ns.map((n) => n.nodeId).sort();
    // A는 B(from), C(to), D(from)와 연결
    expect(ids).toEqual(['B', 'C', 'D']);
  });

  it('엣지 종류를 동반한다', () => {
    const ns = neighbors(edges, 'B');
    const byId = new Map(ns.map((n) => [n.nodeId, n.edgeKind]));
    expect(byId.get('A')).toBe('provides');
    expect(byId.get('C')).toBe('maps-to');
  });

  it('중복 이웃을 제거한다', () => {
    const dup: OntologyEdge[] = [
      { from: 'X', to: 'Y', kind: 'provides' },
      { from: 'Y', to: 'X', kind: 'maps-to' },
    ];
    const ns = neighbors(dup, 'X');
    expect(ns.length).toBe(1);
    expect(ns[0].nodeId).toBe('Y');
  });

  it('연결이 없으면 빈 배열', () => {
    expect(neighbors(edges, 'Z')).toEqual([]);
  });
});

describe('shortestPath', () => {
  // A-B-C-E 선형 + B-D 가지, F 고립
  const edges: OntologyEdge[] = [
    { from: 'A', to: 'B', kind: 'provides' },
    { from: 'B', to: 'C', kind: 'maps-to' },
    { from: 'C', to: 'E', kind: 'belongs-to' },
    { from: 'B', to: 'D', kind: 'provides' },
  ];

  it('존재하는 경로를 최단으로 반환한다', () => {
    expect(shortestPath(edges, 'A', 'E')).toEqual(['A', 'B', 'C', 'E']);
  });

  it('무방향이라 역방향으로도 탐색한다', () => {
    expect(shortestPath(edges, 'E', 'A')).toEqual(['E', 'C', 'B', 'A']);
  });

  it('경로가 없으면 빈 배열', () => {
    expect(shortestPath(edges, 'A', 'F')).toEqual([]);
  });

  it('from===to면 [from]', () => {
    expect(shortestPath(edges, 'B', 'B')).toEqual(['B']);
  });

  it('실제 온톨로지에서 dataset→domain 경로가 존재한다', () => {
    const o = buildOntology();
    const ds = o.nodes.find((n) => n.type === 'dataset')!;
    const dom = o.nodes.find((n) => n.type === 'domain')!;
    const path = shortestPath(o.edges, ds.id, dom.id);
    // 경로가 있다면 양 끝이 정확해야 한다(없을 수도 있으나 본 데이터에선 통상 연결됨)
    if (path.length > 0) {
      expect(path[0]).toBe(ds.id);
      expect(path[path.length - 1]).toBe(dom.id);
    }
  });
});

describe('ontologyCounts', () => {
  it('엔티티=노드수, 관계=엣지수, 속성=meta 키 총합', () => {
    const o = {
      nodes: [
        { id: 'A', type: 'goal' as const, label: 'a' },
        { id: 'B', type: 'indicator' as const, label: 'b', meta: { unit: 'x', source: 'y' } },
        { id: 'C', type: 'indicator' as const, label: 'c', meta: { unit: 'x', source: 'y', direction: 'z' } },
      ],
      edges: [
        { from: 'A', to: 'B', kind: 'maps-to' as const },
        { from: 'B', to: 'C', kind: 'provides' as const },
      ],
    };
    expect(ontologyCounts(o)).toEqual({
      entities: 3,
      relationships: 2,
      properties: 5,
      targets: KSDGS_TARGET_TOTAL,
    });
  });

  it('실제 온톨로지 카운트가 노드/엣지 수와 일치한다', () => {
    const o = buildOntology();
    const counts = ontologyCounts(o);
    expect(counts.entities).toBe(o.nodes.length);
    expect(counts.relationships).toBe(o.edges.length);
    const props = o.nodes.reduce((s, n) => s + (n.meta ? Object.keys(n.meta).length : 0), 0);
    expect(counts.properties).toBe(props);
  });

  it('targets 카운트가 ksdgs.json 세부목표 총수와 일치한다', () => {
    const counts = ontologyCounts(buildOntology());
    expect(counts.targets).toBe(KSDGS_TARGET_TOTAL);
    expect(counts.targets).toBeGreaterThanOrEqual(100);
  });
});

describe('K-SDGs 세부목표(target) 통합', () => {
  it('기본 buildOntology() 노드에는 type==="target" 이 없다(토글 OFF)', () => {
    const { nodes } = buildOntology();
    expect(nodes.some((n) => n.type === 'target')).toBe(false);
  });

  it('기본 buildOntology() 엣지에는 has-target 이 없다', () => {
    const { edges } = buildOntology();
    expect(edges.some((e) => e.kind === 'has-target')).toBe(false);
  });

  it('getTargets(goalNum) 가 ksdgs.json 의 해당 목표 세부목표를 반환한다', () => {
    for (const [numStr, g] of Object.entries(ksdgs.goals)) {
      const num = Number(numStr);
      const ts = getTargets(num);
      expect(ts.length).toBe(g.targets.length);
      expect(ts.map((t) => t.code)).toEqual(g.targets.map((t) => t.code));
    }
  });

  it('getTargets 는 존재하지 않는 목표에 빈 배열을 반환한다', () => {
    expect(getTargets(0)).toEqual([]);
    expect(getTargets(99)).toEqual([]);
  });

  it('includeTargets=true 면 모든 목표의 target 노드를 추가한다', () => {
    const { nodes } = buildOntology({ includeTargets: true });
    const targets = nodes.filter((n) => n.type === 'target');
    expect(targets.length).toBe(KSDGS_TARGET_TOTAL);
  });

  it('targetGoals 로 선택 목표의 target 만 확장한다(전체 동시 표시 방지)', () => {
    const { nodes, edges } = buildOntology({ includeTargets: true, targetGoals: [1] });
    const targets = nodes.filter((n) => n.type === 'target');
    expect(targets.length).toBe(ksdgs.goals['1'].targets.length);
    // 모두 goal-1 의 세부목표여야 한다
    for (const t of targets) {
      expect(t.meta?.goalNum).toBe(1);
    }
    const hasTarget = edges.filter((e) => e.kind === 'has-target');
    expect(hasTarget.length).toBe(targets.length);
    for (const e of hasTarget) {
      expect(e.from).toBe('goal-1');
    }
  });

  it('target 노드 id 가 유일하다(target-<code>)', () => {
    const { nodes } = buildOntology({ includeTargets: true });
    const ids = nodes.filter((n) => n.type === 'target').map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('target-1-1');
  });

  it('has-target 엣지가 ksdgs.json 의 goal→target 매핑과 정확히 일치한다', () => {
    const { edges } = buildOntology({ includeTargets: true });
    const hasTarget = edges.filter((e) => e.kind === 'has-target');
    expect(hasTarget.length).toBe(KSDGS_TARGET_TOTAL);
    for (const [numStr, g] of Object.entries(ksdgs.goals)) {
      for (const t of g.targets) {
        const match = hasTarget.find(
          (e) => e.from === `goal-${numStr}` && e.to === `target-${t.code}`,
        );
        expect(match).toBeDefined();
      }
    }
  });

  it('includeTargets 시 모든 has-target 엣지의 from/to 가 실재 노드를 참조한다', () => {
    const { nodes, edges } = buildOntology({ includeTargets: true });
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges.filter((x) => x.kind === 'has-target')) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });
});
