'use client';

import type {
  OntologyNode,
  OntologyNodeType,
  OntologyNeighbor,
} from '@/lib/sdg/ontology';

const TYPE_LABEL: Record<OntologyNodeType, string> = {
  dataset: '데이터셋',
  indicator: '지표',
  goal: 'SDG 목표',
  domain: '5대 영역',
};

const TYPE_COLOR: Record<OntologyNodeType, string> = {
  dataset: '#0A97D9',
  indicator: '#4C9F38',
  goal: '#E5243B',
  domain: '#19486A',
};

const EDGE_KIND_LABEL: Record<string, string> = {
  provides: '제공',
  'maps-to': '매핑',
  'belongs-to': '소속',
};

/** 노드 meta 키 → 한글 라벨(파생 실데이터만 표시). */
const META_LABEL: Record<string, string> = {
  source: '출처',
  unit: '단위',
  direction: '방향',
};

interface OntologyInspectorProps {
  /** 선택된 노드. null이면 안내 문구만. */
  node: OntologyNode | null;
  /** 선택 노드의 직접 이웃(neighbors 결과) + 이웃 라벨 동반. */
  neighbors: { neighbor: OntologyNeighbor; label: string; type: OntologyNodeType }[];
  /** 이웃 노드 클릭 시 해당 노드로 이동. */
  onSelectNode: (nodeId: string) => void;
}

export default function OntologyInspector({
  node,
  neighbors,
  onSelectNode,
}: OntologyInspectorProps) {
  if (!node) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          INSPECTOR
        </h3>
        <p className="mt-2 text-sm text-slate-400">노드를 선택하세요.</p>
      </div>
    );
  }

  const metaEntries = node.meta
    ? Object.entries(node.meta).filter(([, v]) => v != null && v !== '')
    : [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        INSPECTOR
      </h3>

      {/* 타입 + label */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: TYPE_COLOR[node.type] }}
        />
        <span className="text-xs font-medium text-slate-500">{TYPE_LABEL[node.type]}</span>
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{node.label}</p>

      {/* 메타(출처/단위/방향 등 실데이터) */}
      {metaEntries.length > 0 && (
        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {metaEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <dt className="w-12 shrink-0 text-slate-400">{META_LABEL[key] ?? key}</dt>
              <dd className="break-words text-slate-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* 연결된 노드 목록(neighbors) */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-medium text-slate-500">
          연결된 노드 ({neighbors.length})
        </p>
        {neighbors.length === 0 ? (
          <p className="mt-1 text-xs text-slate-400">직접 연결된 노드가 없습니다.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {neighbors.map(({ neighbor, label, type }) => (
              <li key={neighbor.nodeId}>
                <button
                  type="button"
                  onClick={() => onSelectNode(neighbor.nodeId)}
                  className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs text-slate-700 transition hover:bg-slate-100"
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TYPE_COLOR[type] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {EDGE_KIND_LABEL[neighbor.edgeKind] ?? neighbor.edgeKind}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
