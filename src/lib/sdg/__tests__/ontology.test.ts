import { buildOntology, validateFocus } from '@/lib/sdg/ontology';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { SDG_GOALS, SDG_DOMAINS_5 } from '@/lib/sdg/goals';
import { SDG_DOMAINS } from '@/lib/data/local-sdg-data';

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
