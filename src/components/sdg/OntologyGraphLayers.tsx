'use client';

import {
  type SimNode,
  type SimLink,
  TYPE_COLOR,
  TYPE_RADIUS,
  EDGE_KIND_LABEL,
  linkEndId,
  edgeKey,
} from '@/components/sdg/ontology-graph-utils';

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onExport: () => void;
}

/** 줌+/줌-/리셋/PNG 컨트롤(좌하단). */
export function GraphToolbar({ onZoomIn, onZoomOut, onReset, onExport }: GraphToolbarProps) {
  const iconBtn =
    'flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white/90 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-white';
  const textBtn =
    'flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white/90 px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-white';
  return (
    <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
      <button type="button" onClick={onZoomIn} aria-label="확대" className={iconBtn}>
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="축소" className={iconBtn}>
        −
      </button>
      <button type="button" onClick={onReset} className={textBtn}>
        리셋
      </button>
      <button type="button" onClick={onExport} className={textBtn}>
        PNG
      </button>
    </div>
  );
}

interface EdgeLayerProps {
  links: SimLink[];
  focusIds: Set<string> | null;
  pathEdgeSet: Set<string> | null;
  hoverId: string | null;
}

/** 엣지(선 + 중점 라벨) 레이어. path/focus/hover 강조·흐림 규칙 포함. */
export function EdgeLayer({ links, focusIds, pathEdgeSet, hoverId }: EdgeLayerProps) {
  return (
    <g>
      {links.map((l, i) => {
        // Guard against d3-force first-tick state where source/target may still be strings,
        // or undefined/null before the simulation resolves node references.
        const sRaw = l.source;
        const tRaw = l.target;
        if (typeof sRaw === 'string' || typeof tRaw === 'string' || sRaw == null || tRaw == null) return null;
        const s = sRaw as SimNode;
        const t = tRaw as SimNode;
        const sid = linkEndId(l.source);
        const tid = linkEndId(l.target);
        const onPath = pathEdgeSet?.has(edgeKey(sid, tid)) ?? false;
        const focusActive = focusIds === null || (focusIds.has(sid) && focusIds.has(tid));
        const hovered = hoverId !== null && (hoverId === sid || hoverId === tid);
        // path mode dims everything except the path; otherwise focus/hover rules apply.
        const dimmed = pathEdgeSet ? !onPath : !focusActive;
        const emphasized = onPath || hovered;
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        const showLabel = emphasized || focusActive || pathEdgeSet === null;
        return (
          <g key={`l-${i}`}>
            <line
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={onPath ? '#f59e0b' : '#94a3b8'}
              strokeWidth={emphasized ? 2 : dimmed ? 0.5 : 1.2}
              strokeOpacity={emphasized ? 0.9 : dimmed ? 0.1 : 0.55}
            />
            {/* 'has-target'(세부목표) 엣지는 라벨 생략 — 세부목표 펼침 시 라벨이 과밀해 가독성 저하. 노드로 충분히 드러남. */}
            {showLabel && !dimmed && l.kind !== 'has-target' && (
              <text
                x={mx}
                y={my - 2}
                fontSize={7}
                textAnchor="middle"
                fill={onPath ? '#b45309' : '#64748b'}
                className="pointer-events-none"
                opacity={emphasized ? 1 : 0.7}
              >
                {EDGE_KIND_LABEL[l.kind]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

interface NodeLayerProps {
  nodes: SimNode[];
  focusIds: Set<string> | null;
  pathNodeSet: Set<string> | null;
  onPointerDownNode: (e: React.PointerEvent, node: SimNode) => void;
  onHover: (id: string | null) => void;
  onNodeClick: (nodeId: string) => void;
}

/** 노드(원 + 라벨) 레이어. path/focus 강조·흐림 규칙 포함. */
export function NodeLayer({
  nodes,
  focusIds,
  pathNodeSet,
  onPointerDownNode,
  onHover,
  onNodeClick,
}: NodeLayerProps) {
  return (
    <g>
      {nodes.map((n) => {
        const onPath = pathNodeSet?.has(n.id) ?? false;
        const focusActive = focusIds === null || focusIds.has(n.id);
        const dimmed = pathNodeSet ? !onPath : !focusActive;
        const r = TYPE_RADIUS[n.type];
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            className="cursor-pointer"
            onPointerDown={(e) => onPointerDownNode(e, n)}
            onPointerEnter={() => onHover(n.id)}
            onPointerLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(n.id);
            }}
            opacity={dimmed ? 0.15 : 1}
          >
            <circle
              r={r}
              fill={TYPE_COLOR[n.type]}
              stroke={onPath ? '#f59e0b' : '#ffffff'}
              strokeWidth={onPath ? 2.5 : 1.2}
            />
            <text x={r + 3} y={3} fontSize={9} fill="#1e293b" className="pointer-events-none">
              {n.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
