'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import OntologyGraph, { type OntologyGraphHandle } from '@/components/sdg/OntologyGraph';
import OntologyInspector from '@/components/sdg/OntologyInspector';
import { InsightsPanel, PathFinderPanel } from '@/components/sdg/OntologyPanels';
import {
  neighbors as computeNeighbors,
  shortestPath,
  ontologyCounts,
  getTargets,
  getUNTargets,
  getUNTargetsMeta,
  type Ontology,
  type OntologyNode,
  type OntologyNodeType,
  type OntologyEdge,
  type KsdgsTarget,
  type UNTarget,
} from '@/lib/sdg/ontology';

interface OntologyViewProps {
  nodes: Ontology['nodes'];
  edges: Ontology['edges'];
}

const TYPE_META: { type: OntologyNodeType; label: string; color: string }[] = [
  { type: 'dataset', label: '데이터셋', color: '#0A97D9' },
  { type: 'indicator', label: '지표', color: '#4C9F38' },
  { type: 'goal', label: 'SDG 목표', color: '#E5243B' },
  { type: 'domain', label: '5대 영역', color: '#19486A' },
  { type: 'target', label: 'K-SDGs 세부목표', color: '#FD9D24' },
  { type: 'un-target', label: 'UN 세부목표', color: '#6366F1' },
];

/** goal 노드 id(goal-N) → 목표 번호 N. 아니면 null. */
function goalNumFromId(id: string | null): number | null {
  if (!id) return null;
  const m = /^goal-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

type FocusStatus = 'idle' | 'loading' | 'error';

export default function OntologyView({ nodes, edges }: OntologyViewProps) {
  const [activeTypes, setActiveTypes] = useState<Set<OntologyNodeType>>(
    () => new Set<OntologyNodeType>(['dataset', 'indicator', 'goal', 'domain', 'target', 'un-target']),
  );
  const [showTargets, setShowTargets] = useState(false);
  const [showUNTargets, setShowUNTargets] = useState(false);
  const [focusIds, setFocusIds] = useState<Set<string> | null>(null);
  const [pathIds, setPathIds] = useState<string[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FocusStatus>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [pathNote, setPathNote] = useState<string | null>(null);

  const graphRef = useRef<OntologyGraphHandle>(null);

  // 선택 노드가 goal 이면 그 목표 번호(세부목표 확장·INSPECTOR용).
  const selectedGoalNum = useMemo(() => goalNumFromId(selectedId), [selectedId]);

  // 선택 goal 의 K-SDGs 세부목표(공식 ncsd.go.kr) — INSPECTOR 표시용.
  const selectedTargets = useMemo<KsdgsTarget[]>(
    () => (selectedGoalNum != null ? getTargets(selectedGoalNum) : []),
    [selectedGoalNum],
  );

  // 선택 goal 의 UN 169 세부목표(국제 원본, UN SDG API) — INSPECTOR 표시용.
  const selectedUNTargets = useMemo<UNTarget[]>(
    () => (selectedGoalNum != null ? getUNTargets(selectedGoalNum) : []),
    [selectedGoalNum],
  );

  // UN 세부목표 출처 메타(배지·고지용, 정적 고정값).
  const unMeta = useMemo(() => getUNTargetsMeta(), []);

  // 토글 ON + goal 선택 시 그 goal 의 target/un-target 노드·엣지만 그래프에 확장(전체 동시 표시 금지).
  const expanded = useMemo<Ontology>(() => {
    const extraNodes: OntologyNode[] = [];
    const extraEdges: OntologyEdge[] = [];

    // K-SDGs 세부목표 확장
    if (showTargets && selectedGoalNum != null) {
      for (const t of selectedTargets) {
        extraNodes.push({
          id: `target-${t.code}`,
          type: 'target' as const,
          label: t.code,
          meta: { text: t.text, goalNum: selectedGoalNum },
        });
        extraEdges.push({
          from: `goal-${selectedGoalNum}`,
          to: `target-${t.code}`,
          kind: 'has-target' as const,
        });
      }
    }

    // UN 169 세부목표 확장(목표별 한정, id prefix 달라 K-SDGs와 충돌 없음)
    if (showUNTargets && selectedGoalNum != null) {
      for (const t of selectedUNTargets) {
        extraNodes.push({
          id: `un-target-${t.code}`,
          type: 'un-target' as const,
          label: t.code,
          meta: { en: t.en, ko: t.ko, goalNum: selectedGoalNum },
        });
        extraEdges.push({
          from: `goal-${selectedGoalNum}`,
          to: `un-target-${t.code}`,
          kind: 'has-target' as const,
        });
      }
    }

    if (extraNodes.length === 0) return { nodes, edges };
    return { nodes: [...nodes, ...extraNodes], edges: [...edges, ...extraEdges] };
  }, [showTargets, showUNTargets, selectedGoalNum, selectedTargets, selectedUNTargets, nodes, edges]);

  const counts = useMemo(() => ontologyCounts(expanded), [expanded]);
  const nodeById = useMemo(() => new Map(expanded.nodes.map((n) => [n.id, n])), [expanded.nodes]);

  // visible ontology after type filtering
  const visibleOntology = useMemo<Ontology>(() => {
    const visibleNodes = expanded.nodes.filter((n) => activeTypes.has(n.type));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = expanded.edges.filter(
      (e) => visibleIds.has(e.from) && visibleIds.has(e.to),
    );
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [expanded, activeTypes]);

  const selectedNode: OntologyNode | null = selectedId ? nodeById.get(selectedId) ?? null : null;

  // neighbors of selected node, enriched with label/type for the inspector
  const selectedNeighbors = useMemo(() => {
    if (!selectedId) return [];
    return computeNeighbors(expanded.edges, selectedId)
      .map((nb) => {
        const node = nodeById.get(nb.nodeId);
        if (!node) return null;
        return { neighbor: nb, label: node.label, type: node.type };
      })
      .filter((x): x is { neighbor: ReturnType<typeof computeNeighbors>[number]; label: string; type: OntologyNodeType } => x !== null);
  }, [selectedId, expanded.edges, nodeById]);

  // sorted node options for the path-finder selects (grouped by type implicitly via label)
  const nodeOptions = useMemo(
    () =>
      [...expanded.nodes].sort(
        (a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label),
      ),
    [expanded.nodes],
  );

  const toggleType = useCallback((type: OntologyNodeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const selectNode = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      const ns = computeNeighbors(expanded.edges, nodeId);
      const focus = new Set<string>([nodeId, ...ns.map((n) => n.nodeId)]);
      // 토글 ON + goal 선택 시, 다음 렌더에서 확장될 target/un-target 들도 미리 포커스에 포함.
      const gNum = goalNumFromId(nodeId);
      if (showTargets && gNum != null) {
        for (const t of getTargets(gNum)) focus.add(`target-${t.code}`);
      }
      if (showUNTargets && gNum != null) {
        for (const t of getUNTargets(gNum)) focus.add(`un-target-${t.code}`);
      }
      setFocusIds(focus);
      setPathIds(null);
      setPathNote(null);
      setNote('노드 선택: 직접 연결된 이웃을 강조합니다.');
    },
    [expanded.edges, showTargets, showUNTargets],
  );

  const clearFocus = useCallback(() => {
    setFocusIds(null);
    setPathIds(null);
    setSelectedId(null);
    setNote(null);
    setPathNote(null);
    setStatus('idle');
  }, []);

  const findPath = useCallback(() => {
    if (!fromId || !toId) {
      setPathNote('출발/도착 노드를 모두 선택하세요.');
      return;
    }
    if (fromId === toId) {
      setPathNote('출발과 도착이 같습니다.');
      return;
    }
    const path = shortestPath(expanded.edges, fromId, toId);
    if (path.length === 0) {
      setPathIds(null);
      setPathNote('경로 없음: 두 노드가 연결되어 있지 않습니다.');
      return;
    }
    setPathIds(path);
    setFocusIds(null);
    setSelectedId(null);
    setPathNote(`경로 ${path.length}개 노드를 강조합니다.`);
  }, [fromId, toId, expanded.edges]);

  const submitQuery = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      setStatus('loading');
      setNote(null);
      try {
        const res = await fetch('/api/sdg/ontology-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: { focusNodeIds?: string[]; note?: string } = await res.json();
        const ids = Array.isArray(data.focusNodeIds) ? data.focusNodeIds : [];
        if (ids.length === 0) {
          setStatus('error');
          setNote('포커스 결과가 없습니다. 위 카테고리 필터로 수동 탐색하세요.');
          return;
        }
        setFocusIds(new Set(ids));
        setPathIds(null);
        setSelectedId(null);
        setStatus('idle');
        setNote(data.note ?? '정의된 관계만 강조');
      } catch {
        setStatus('error');
        setNote('포커스 실패: 카테고리 필터로 수동 탐색하세요.');
      }
    },
    [query],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_520px]">
      {/* ── 좌측/중앙: 컨트롤 + 그래프 + 범례 ── */}
      <div className="flex flex-col gap-4">
        {/* 카테고리 필터 칩 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">표시:</span>
          {TYPE_META.map((t) => {
            const on = activeTypes.has(t.type);
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => toggleType(t.type)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                  on ? 'border-transparent text-white' : 'border-slate-300 bg-white text-slate-400'
                }`}
                style={on ? { backgroundColor: t.color } : undefined}
                aria-pressed={on}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: on ? '#ffffff' : t.color }}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 세부목표 노드 표시 토글 (K-SDGs + UN 169) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* K-SDGs 세부목표 토글 */}
          <button
            type="button"
            onClick={() => setShowTargets((v) => !v)}
            aria-pressed={showTargets}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
              showTargets
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-300 bg-white text-slate-500'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-6 rounded-full transition ${
                showTargets ? 'bg-amber-400' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                  showTargets ? 'translate-x-2.5' : 'translate-x-0'
                }`}
              />
            </span>
            K-SDGs 노드 표시
          </button>

          {/* UN 169 세부목표 토글 */}
          <button
            type="button"
            onClick={() => setShowUNTargets((v) => !v)}
            aria-pressed={showUNTargets}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
              showUNTargets
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-300 bg-white text-slate-500'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-6 rounded-full transition ${
                showUNTargets ? 'bg-indigo-400' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                  showUNTargets ? 'translate-x-2.5' : 'translate-x-0'
                }`}
              />
            </span>
            UN 169 노드 표시
          </button>

          <span className="text-xs text-slate-400">
            {showTargets && showUNTargets
              ? 'SDG 목표 노드를 선택하면 K-SDGs 세부목표와 UN 169 세부목표가 함께 그래프에 펼쳐집니다.'
              : showTargets
              ? 'SDG 목표 노드를 선택하면 그 목표의 K-SDGs 세부목표가 그래프에 펼쳐집니다.'
              : showUNTargets
              ? 'SDG 목표 노드를 선택하면 그 목표의 UN 169 세부목표가 그래프에 펼쳐집니다.'
              : '세부목표를 그래프 노드로 확장하려면 토글을 켜세요(목표 선택 시 해당 목표만).'}
          </span>
        </div>

        {/* NL 명령창 */}
        <form onSubmit={submitQuery} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 재정과 SDG 관계만 보여줘 / 환경 지표 강조"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === 'loading' ? '분석 중…' : '포커스'}
          </button>
          <button
            type="button"
            onClick={clearFocus}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            전체 보기
          </button>
        </form>

        {note && (
          <p
            className={`text-sm ${status === 'error' ? 'text-amber-600' : 'text-slate-500'}`}
            role="status"
          >
            {note}
          </p>
        )}

        {/* 그래프 */}
        <div className="h-[620px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <OntologyGraph
            ref={graphRef}
            ontology={visibleOntology}
            focusIds={focusIds}
            pathIds={pathIds}
            onNodeClick={selectNode}
          />
        </div>

        {/* 범례 */}
        <div className="flex flex-wrap items-center gap-4">
          {TYPE_META.map((t) => (
            <div key={t.type} className="flex items-center gap-1.5 text-sm text-slate-600">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </div>
          ))}
          <span className="text-sm text-slate-400">
            엣지: 데이터셋→지표(제공) · 지표→목표(매핑) · 목표→영역(소속) · 목표→세부목표(K-SDGs·UN)
          </span>
        </div>

        {/* 고지 */}
        <p className="rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-500">
          정의된 데이터셋·지표·목표 관계도이며, AI는 기존 관계를 강조할 뿐 새 관계를 만들지
          않습니다. K-SDGs 세부목표 출처: 지속가능발전포털(ncsd.go.kr).
        </p>
      </div>

      {/* ── 우측 패널: INSIGHTS · PATH FINDER · INSPECTOR ── */}
      <aside className="flex flex-col gap-4">
        <InsightsPanel counts={counts} />
        <PathFinderPanel
          options={nodeOptions}
          fromId={fromId}
          toId={toId}
          onFromChange={setFromId}
          onToChange={setToId}
          onFind={findPath}
          note={pathNote}
        />
        <OntologyInspector
          node={selectedNode}
          neighbors={selectedNeighbors}
          targets={selectedTargets}
          unTargets={selectedUNTargets}
          unMeta={unMeta}
          onSelectNode={selectNode}
        />
      </aside>
    </div>
  );
}
