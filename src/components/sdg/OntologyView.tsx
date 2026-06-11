'use client';

import { useMemo, useState, useCallback } from 'react';
import OntologyGraph from '@/components/sdg/OntologyGraph';
import type { Ontology, OntologyNodeType } from '@/lib/sdg/ontology';

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
  // category filter chips (which node types are visible)
  const [activeTypes, setActiveTypes] = useState<Set<OntologyNodeType>>(
    () => new Set<OntologyNodeType>(['dataset', 'indicator', 'goal', 'domain']),
  );

  // focus set from node click or NL command (validated ids only)
  const [focusIds, setFocusIds] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FocusStatus>('idle');
  const [note, setNote] = useState<string | null>(null);

  // adjacency lookup for neighbor highlight (deterministic, client-side)
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.from)) map.set(e.from, new Set());
      if (!map.has(e.to)) map.set(e.to, new Set());
      map.get(e.from)!.add(e.to);
      map.get(e.to)!.add(e.from);
    }
    return map;
  }, [edges]);

  // visible ontology after type filtering
  const visibleOntology = useMemo<Ontology>(() => {
    const visibleNodes = nodes.filter((n) => activeTypes.has(n.type));
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));
    return { nodes: visibleNodes, edges: visibleEdges };
  }, [nodes, edges, activeTypes]);

  const toggleType = useCallback((type: OntologyNodeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const neighbors = adjacency.get(nodeId) ?? new Set<string>();
      const next = new Set<string>([nodeId, ...neighbors]);
      setFocusIds(next);
      setNote('노드 클릭: 직접 연결된 이웃을 강조합니다.');
    },
    [adjacency],
  );

  const clearFocus = useCallback(() => {
    setFocusIds(null);
    setNote(null);
    setStatus('idle');
  }, []);

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
                on
                  ? 'border-transparent text-white'
                  : 'border-slate-300 bg-white text-slate-400'
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
          ontology={visibleOntology}
          focusIds={focusIds}
          onNodeClick={handleNodeClick}
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
        정의된 데이터셋·지표·목표 관계도이며, AI는 기존 관계를 강조할 뿐 새 관계를 만들지 않습니다.
      </p>
    </div>
  );
}
