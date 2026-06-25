'use client';

import type {
  OntologyNode,
  OntologyNodeType,
  OntologyNeighbor,
  KsdgsTarget,
  UNTarget,
  UNTargetsMeta,
} from '@/lib/sdg/ontology';
import UNTargetsSection from '@/components/sdg/UNTargetsSection';

const TYPE_LABEL: Record<OntologyNodeType, string> = {
  dataset: '데이터셋',
  indicator: '지표',
  goal: 'SDG 목표',
  domain: '5대 영역',
  target: 'K-SDGs 세부목표',
  'un-target': 'UN 세부목표',
};

const TYPE_COLOR: Record<OntologyNodeType, string> = {
  dataset: '#0A97D9',
  indicator: '#4C9F38',
  goal: '#E5243B',
  domain: '#19486A',
  target: '#FD9D24',
  'un-target': '#6366F1',
};

const EDGE_KIND_LABEL: Record<string, string> = {
  provides: '제공',
  'maps-to': '매핑',
  'belongs-to': '소속',
  'has-target': '세부목표',
};

/** 노드 meta 키 → 한글 라벨(파생 실데이터만 표시). */
const META_LABEL: Record<string, string> = {
  source: '출처',
  unit: '단위',
  direction: '방향',
  text: '내용',
  goalNum: '소속 목표',
  en: '영문(공식)',
  ko: '국문(비공식)',
};

/** 지속가능발전포털 출처 URL(K-SDGs). */
const KSDGS_SOURCE_URL = 'https://www.ncsd.go.kr/ksdgs/goals';

interface OntologyInspectorProps {
  /** 선택된 노드. null이면 안내 문구만. */
  node: OntologyNode | null;
  /** 선택 노드의 직접 이웃(neighbors 결과) + 이웃 라벨 동반. */
  neighbors: { neighbor: OntologyNeighbor; label: string; type: OntologyNodeType }[];
  /**
   * 선택 노드가 goal 일 때 표시할 K-SDGs 세부목표 목록(코드+텍스트).
   * goal 이 아니거나 데이터가 없으면 빈 배열.
   */
  targets?: KsdgsTarget[];
  /**
   * 선택 노드가 goal 일 때 표시할 UN 169 세부목표(국제 원본). goal 이 아니면 빈 배열.
   */
  unTargets?: UNTarget[];
  /** UN 세부목표 출처 메타(source/url/fetchedAt). */
  unMeta: UNTargetsMeta;
  /** 이웃 노드 클릭 시 해당 노드로 이동. */
  onSelectNode: (nodeId: string) => void;
}

export default function OntologyInspector({
  node,
  neighbors,
  targets = [],
  unTargets = [],
  unMeta,
  onSelectNode,
}: OntologyInspectorProps) {
  if (!node) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          INSPECTOR
        </h3>
        <p className="mt-2 text-base text-slate-400">노드를 선택하세요.</p>
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
        <span className="text-sm font-medium text-slate-500">{TYPE_LABEL[node.type]}</span>
      </div>
      <p className="mt-1 break-words text-lg font-semibold text-slate-800">{node.label}</p>

      {/* 메타(출처/단위/방향 등 실데이터) */}
      {metaEntries.length > 0 && (
        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {metaEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm">
              <dt className="w-12 shrink-0 text-slate-400">{META_LABEL[key] ?? key}</dt>
              <dd className="break-words text-slate-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* UN 세부목표 노드 선택 시: 코드 + 영문(공식) + 국문(비공식) 표시 */}
      {node.type === 'un-target' && (
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5">
          {node.meta?.en && (
            <p className="text-sm leading-relaxed text-slate-700">{node.meta.en}</p>
          )}
          {node.meta?.ko && (
            <p className="text-sm leading-relaxed text-slate-500">
              <span className="mr-1 rounded bg-indigo-50 px-1 py-0.5 text-xs text-indigo-500">비공식</span>
              {node.meta.ko}
            </p>
          )}
          <p className="text-xs text-slate-400">
            출처: UN Statistics Division SDG API (A/RES/70/1)
          </p>
        </div>
      )}

      {/* K-SDGs 세부목표(goal 노드 선택 시) */}
      {node.type === 'goal' && targets.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium text-slate-500">
            K-SDGs 세부목표 ({targets.length})
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {targets.map((t) => (
              <li key={t.code} className="flex gap-2 text-sm leading-relaxed">
                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-700">
                  {t.code}
                  {t.note ? ` (${t.note})` : ''}
                </span>
                <span className="min-w-0 flex-1 text-slate-700">{t.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            출처: 지속가능발전포털(
            <a
              href={KSDGS_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              ncsd.go.kr
            </a>
            )
          </p>
        </div>
      )}

      {/* UN 169 세부목표(국제 기준) — goal 노드 선택 시 K-SDGs 아래에 표시 */}
      {node.type === 'goal' && (
        <UNTargetsSection targets={unTargets} meta={unMeta} />
      )}

      {/* 연결된 노드 목록(neighbors) */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-sm font-medium text-slate-500">
          연결된 노드 ({neighbors.length})
        </p>
        {neighbors.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">직접 연결된 노드가 없습니다.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {neighbors.map(({ neighbor, label, type }) => (
              <li key={neighbor.nodeId}>
                <button
                  type="button"
                  onClick={() => onSelectNode(neighbor.nodeId)}
                  className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TYPE_COLOR[type] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
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
