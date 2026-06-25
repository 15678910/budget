'use client';

import type { OntologyNode, OntologyCounts } from '@/lib/sdg/ontology';

/** INSIGHTS: 엔티티/관계/속성 카운트 패널. */
export function InsightsPanel({ counts }: { counts: OntologyCounts }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">INSIGHTS</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <dt className="text-[11px] text-slate-400">엔티티</dt>
          <dd className="text-lg font-bold text-slate-800">{counts.entities}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">관계</dt>
          <dd className="text-lg font-bold text-slate-800">{counts.relationships}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">속성</dt>
          <dd className="text-lg font-bold text-slate-800">{counts.properties}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">K-SDGs 세부목표</dt>
          <dd className="text-lg font-bold text-slate-800">{counts.targets}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-slate-400">UN 169 세부목표</dt>
          <dd className="text-lg font-bold text-slate-800">{counts.unTargets}</dd>
        </div>
      </dl>
    </div>
  );
}

interface PathFinderPanelProps {
  options: OntologyNode[];
  fromId: string;
  toId: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onFind: () => void;
  note: string | null;
}

/** PATH FINDER: 두 노드 select + 경로 찾기 버튼. */
export function PathFinderPanel({
  options,
  fromId,
  toId,
  onFromChange,
  onToChange,
  onFind,
  note,
}: PathFinderPanelProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">PATH FINDER</h3>
      <div className="mt-2 space-y-2">
        <label className="block">
          <span className="text-[11px] text-slate-400">출발</span>
          <select
            value={fromId}
            onChange={(e) => onFromChange(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
          >
            <option value="">선택…</option>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-slate-400">도착</span>
          <select
            value={toId}
            onChange={(e) => onToChange(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
          >
            <option value="">선택…</option>
            {options.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onFind}
          className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600"
        >
          경로 찾기
        </button>
        {note && (
          <p className="text-[11px] text-slate-500" role="status">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
