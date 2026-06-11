'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from 'd3-force';
import type {
  Ontology,
  OntologyNode,
  OntologyNodeType,
} from '@/lib/sdg/ontology';

// d3-force mutates node objects with x/y/vx/vy; extend the node shape for the simulation.
interface SimNode extends OntologyNode {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  kind: string;
}

const TYPE_COLOR: Record<OntologyNodeType, string> = {
  dataset: '#0A97D9',
  indicator: '#4C9F38',
  goal: '#E5243B',
  domain: '#19486A',
};

const TYPE_RADIUS: Record<OntologyNodeType, number> = {
  dataset: 9,
  indicator: 6,
  goal: 11,
  domain: 14,
};

const WIDTH = 900;
const HEIGHT = 620;

function linkEndId(end: string | SimNode): string {
  return typeof end === 'string' ? end : end.id;
}

interface OntologyGraphProps {
  ontology: Ontology;
  /** 강조 집합. null이면 전체 균등 표시 */
  focusIds: Set<string> | null;
  onNodeClick: (nodeId: string) => void;
}

export default function OntologyGraph({ ontology, focusIds, onNodeClick }: OntologyGraphProps) {
  // Graph data lives in state so render never reads from a ref. d3 mutates these same
  // objects in place; the tick handler bumps `version` to re-render with fresh x/y.
  const [graph, setGraph] = useState<{ nodes: SimNode[]; links: SimLink[] }>({
    nodes: [],
    links: [],
  });
  const [, setVersion] = useState(0);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const draggingRef = useRef<SimNode | null>(null);
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

  // ── pointer-based drag (no d3-drag dependency) ──
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * WIDTH,
      y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
  }, []);

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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const node = draggingRef.current;
      if (!node) return;
      const { x, y } = toLocal(e.clientX, e.clientY);
      node.fx = x;
      node.fy = y;
    },
    [toLocal],
  );

  const handlePointerUp = useCallback(() => {
    const node = draggingRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    draggingRef.current = null;
    simRef.current?.alphaTarget(0);
  }, []);

  // Neighbor set for dimming: a node/link is "active" if focusIds null, or it/its endpoints intersect focusIds.
  const isNodeActive = useCallback(
    (id: string) => focusIds === null || focusIds.has(id),
    [focusIds],
  );

  const { nodes, links } = graph;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-full touch-none select-none"
      role="img"
      aria-label="SDG 데이터 온톨로지 관계도"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <g>
        {links.map((l, i) => {
          const s = l.source as SimNode;
          const t = l.target as SimNode;
          if (typeof s === 'string' || typeof t === 'string') return null;
          const active =
            focusIds === null ||
            (focusIds.has(linkEndId(l.source)) && focusIds.has(linkEndId(l.target)));
          return (
            <line
              key={`l-${i}`}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke="#94a3b8"
              strokeWidth={active ? 1.2 : 0.5}
              strokeOpacity={active ? 0.55 : 0.12}
            />
          );
        })}
      </g>
      <g>
        {nodes.map((n) => {
          const active = isNodeActive(n.id);
          const r = TYPE_RADIUS[n.type];
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              className="cursor-pointer"
              onPointerDown={(e) => handlePointerDownNode(e, n)}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(n.id);
              }}
              opacity={active ? 1 : 0.18}
            >
              <circle
                r={r}
                fill={TYPE_COLOR[n.type]}
                stroke="#ffffff"
                strokeWidth={1.2}
              />
              <text
                x={r + 3}
                y={3}
                fontSize={9}
                fill="#1e293b"
                className="pointer-events-none"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
