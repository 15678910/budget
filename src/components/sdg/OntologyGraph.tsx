'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from 'd3-force';
import type { Ontology } from '@/lib/sdg/ontology';
import {
  type SimNode,
  type SimLink,
  type ViewTransform,
  TYPE_RADIUS,
  WIDTH,
  HEIGHT,
  SCALE_STEP,
  INITIAL_TRANSFORM,
  edgeKey,
  clampScale,
  exportSvgToPng,
} from '@/components/sdg/ontology-graph-utils';
import { EdgeLayer, NodeLayer, GraphToolbar } from '@/components/sdg/OntologyGraphLayers';

export interface OntologyGraphHandle {
  /** SVG를 직렬화하여 PNG로 다운로드. (html2canvas 미사용 — SVG→canvas 직렬화) */
  exportPng: (fileName?: string) => void;
}

interface OntologyGraphProps {
  ontology: Ontology;
  /** 강조 집합. null이면 전체 균등 표시 */
  focusIds: Set<string> | null;
  /** 최단 경로 노드 id 배열. null/빈 배열이면 경로 강조 없음. */
  pathIds: string[] | null;
  onNodeClick: (nodeId: string) => void;
}

function OntologyGraphImpl(
  { ontology, focusIds, pathIds, onNodeClick }: OntologyGraphProps,
  ref: React.Ref<OntologyGraphHandle>,
) {
  // Graph data lives in state so render never reads from a ref. d3 mutates these same
  // objects in place; the tick handler bumps `version` to re-render with fresh x/y.
  const [graph, setGraph] = useState<{ nodes: SimNode[]; links: SimLink[] }>({
    nodes: [],
    links: [],
  });
  const [, setVersion] = useState(0);
  const [view, setView] = useState<ViewTransform>(INITIAL_TRANSFORM);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const draggingRef = useRef<SimNode | null>(null);
  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Build simulation node/link objects once per ontology identity.
  const graphKey = useMemo(
    () => `${ontology.nodes.length}-${ontology.edges.length}`,
    [ontology.nodes.length, ontology.edges.length],
  );

  useEffect(() => {
    const simNodes: SimNode[] = ontology.nodes.map((n, i) => {
      // deterministic-ish initial layout (ring) to avoid SSR/CSR jump and seed the sim
      const angle = (i / ontology.nodes.length) * Math.PI * 2;
      return {
        ...n,
        x: WIDTH / 2 + Math.cos(angle) * 200,
        y: HEIGHT / 2 + Math.sin(angle) * 200,
      };
    });
    const simLinks: SimLink[] = ontology.edges.map((e) => ({
      source: e.from,
      target: e.to,
      kind: e.kind,
    }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(70)
          .strength(0.4),
      )
      .force('charge', forceManyBody().strength(-160))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide<SimNode>().radius((d) => TYPE_RADIUS[d.type] + 6))
      .on('tick', () => setVersion((v) => v + 1));

    simRef.current = sim;
    // d3-force 시뮬레이션은 외부 시스템이라 effect에서만 생성 가능하고,
    // 생성된 노드/링크 객체를 렌더에 1회 공개해야 한다(이후 좌표는 tick으로 갱신).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGraph({ nodes: simNodes, links: simLinks });

    return () => {
      sim.stop();
    };
  }, [graphKey, ontology.edges, ontology.nodes]);

  // ── coordinate helper: client → SVG viewBox space (independent of view transform) ──
  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * WIDTH,
      y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
  }, []);

  // client → graph (world) space: undo the current view transform.
  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = toViewBox(clientX, clientY);
      return { x: (x - view.tx) / view.scale, y: (y - view.ty) / view.scale };
    },
    [toViewBox, view.tx, view.ty, view.scale],
  );

  // ── node drag ──
  const handlePointerDownNode = useCallback(
    (e: React.PointerEvent, node: SimNode) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      draggingRef.current = node;
      simRef.current?.alphaTarget(0.3).restart();
      const { x, y } = toLocal(e.clientX, e.clientY);
      node.fx = x;
      node.fy = y;
    },
    [toLocal],
  );

  // ── canvas pan (pointer down on empty area) ──
  const handlePointerDownCanvas = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = toViewBox(e.clientX, e.clientY);
      panRef.current = { startX: x, startY: y, tx: view.tx, ty: view.ty };
    },
    [toViewBox, view.tx, view.ty],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const node = draggingRef.current;
      if (node) {
        const { x, y } = toLocal(e.clientX, e.clientY);
        node.fx = x;
        node.fy = y;
        return;
      }
      const pan = panRef.current;
      if (pan) {
        const { x, y } = toViewBox(e.clientX, e.clientY);
        setView((v) => ({ ...v, tx: pan.tx + (x - pan.startX), ty: pan.ty + (y - pan.startY) }));
      }
    },
    [toLocal, toViewBox],
  );

  const handlePointerUp = useCallback(() => {
    const node = draggingRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    draggingRef.current = null;
    panRef.current = null;
    simRef.current?.alphaTarget(0);
  }, []);

  // ── zoom around viewBox center ──
  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const next = clampScale(v.scale * factor);
      if (next === v.scale) return v;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const tx = cx - ((cx - v.tx) / v.scale) * next;
      const ty = cy - ((cy - v.ty) / v.scale) * next;
      return { scale: next, tx, ty };
    });
  }, []);

  const resetView = useCallback(() => setView(INITIAL_TRANSFORM), []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const { x: vx, y: vy } = toViewBox(e.clientX, e.clientY);
      setView((v) => {
        const factor = e.deltaY < 0 ? SCALE_STEP : 1 / SCALE_STEP;
        const next = clampScale(v.scale * factor);
        if (next === v.scale) return v;
        // zoom toward cursor: world point under cursor stays under cursor
        const tx = vx - ((vx - v.tx) / v.scale) * next;
        const ty = vy - ((vy - v.ty) / v.scale) * next;
        return { scale: next, tx, ty };
      });
    },
    [toViewBox],
  );

  // ── PNG export (SVG serialize → canvas → download) ──
  const exportPng = useCallback(
    (fileName = 'sdg-ontology.png') => exportSvgToPng(svgRef.current, fileName),
    [],
  );

  useImperativeHandle(ref, () => ({ exportPng }), [exportPng]);

  // ── highlight sets ──
  const pathNodeSet = useMemo(
    () => (pathIds && pathIds.length > 0 ? new Set(pathIds) : null),
    [pathIds],
  );
  // consecutive pairs in the path form the highlighted path edges (undirected)
  const pathEdgeSet = useMemo(() => {
    if (!pathIds || pathIds.length < 2) return null;
    const s = new Set<string>();
    for (let i = 0; i < pathIds.length - 1; i++) {
      s.add(edgeKey(pathIds[i], pathIds[i + 1]));
    }
    return s;
  }, [pathIds]);

  const { nodes, links } = graph;

  return (
    <div className="relative h-full w-full">
      <GraphToolbar
        onZoomIn={() => zoomBy(SCALE_STEP)}
        onZoomOut={() => zoomBy(1 / SCALE_STEP)}
        onReset={resetView}
        onExport={() => exportPng()}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="SDG 데이터 온톨로지 관계도"
        onPointerDown={handlePointerDownCanvas}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
          <EdgeLayer
            links={links}
            focusIds={focusIds}
            pathEdgeSet={pathEdgeSet}
            hoverId={hoverId}
          />
          <NodeLayer
            nodes={nodes}
            focusIds={focusIds}
            pathNodeSet={pathNodeSet}
            onPointerDownNode={handlePointerDownNode}
            onHover={setHoverId}
            onNodeClick={onNodeClick}
          />
        </g>
      </svg>
    </div>
  );
}

const OntologyGraph = forwardRef<OntologyGraphHandle, OntologyGraphProps>(OntologyGraphImpl);
OntologyGraph.displayName = 'OntologyGraph';

export default OntologyGraph;
