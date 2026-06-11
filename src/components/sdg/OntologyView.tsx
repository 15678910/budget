'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import OntologyGraph, { type OntologyGraphHandle } from '@/components/sdg/OntologyGraph';
import OntologyInspector from '@/components/sdg/OntologyInspector';
import { InsightsPanel, PathFinderPanel } from '@/components/sdg/OntologyPanels';
import {
  neighbors as computeNeighbors,
  shortestPath,
  ontologyCounts,
  type Ontology,
  type OntologyNode,
  type OntologyNodeType,
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
];

type FocusStatus = 'idle' | 'loading' | 'error';

export default function OntologyView({ nodes, edges }: OntologyViewProps) {
  const [activeTypes, setActiveTypes] = useState<Set<OntologyNodeType>>(
    () => new Set<OntologyNodeType>(['dataset', 'indicator', 'goal', 'domain']),
  );
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

  const ontology = useMemo<Ontology>(() => ({ nodes, edges }), [nodes, edges]);
  const counts = useMemo(() => ontologyCounts(ontology), [ontology]);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // visible ontology after type filtering
  const visibleOntology = useMemo<Ontology>(() => {
    const visibleNodes = nodes.filter((n) => activeTypes.has(n.type));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [nodes, edges, activeTypes]);

  const selectedNode: OntologyNode | null = selectedId ? nodeById.get(selectedId) ?? null : null;

  // neighbors of selected node, enriched with label/type for the inspector
  const selectedNeighbors = useMemo(() => {
    if (!selectedId) return [];
    return computeNeighbors(edges, selectedId)
      .map((nb) => {
        const node = nodeById.get(nb.nodeId);
        if (!node) return null;
        return { neighbor: nb, label: node.label, type: node.type };
      })
      .filter((x): x is { neighbor: ReturnType<typeof computeNeighbors>[number]; label: string; type: OntologyNodeType } => x !== null);
  }, [selectedId, edges, nodeById]);

  // sorted node options for the path-finder selects (grouped by type implicitly via label)
  const nodeOptions = useMemo(
    () =>
      [...nodes].sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label)),
    [nodes],
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
      const ns = computeNeighbors(edges, nodeId);
      setFocusIds(new Set<string>([nodeId, ...ns.map((n) => n.nodeId)]));
      setPathIds(null);
      setPathNote(null);
      setNote('노드 선택: 직접 연결된 이웃을 강조합니다.');
    },
    [edges],
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
    const path = shortestPath(edges, fromId, toId);
    if (path.length === 0) {
      setPathIds(null);
      setPathNote('경로 없음: 두 노드가 연결되어 있지 않습니다.');
      return;
    }
    setPathIds(path);
    setFocusIds(null);
    setSelectedId(null);
    setPathNote(`경로 ${path.length}개 노드를 강조합니다.`);
  }, [fromId, toId, edges]);

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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
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
            엣지: 데이터셋→지표(제공) · 지표→목표(매핑) · 목표→영역(소속)
          </span>
        </div>

        {/* 고지 */}
        <p className="rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-500">
          정의된 데이터셋·지표·목표 관계도이며, AI는 기존 관계를 강조할 뿐 새 관계를 만들지
          않습니다.
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
          onSelectNode={selectNode}
        />
      </aside>
    </div>
  );
}
