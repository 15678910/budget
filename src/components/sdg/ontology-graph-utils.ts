// OntologyGraph 보조 유틸 — 상수·좌표 변환·PNG 직렬화 분리(컴포넌트 300줄 관리).
import type {
  OntologyNode,
  OntologyNodeType,
  OntologyEdgeKind,
} from '@/lib/sdg/ontology';

// d3-force mutates node objects with x/y/vx/vy; extend the node shape for the simulation.
export interface SimNode extends OntologyNode {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  kind: OntologyEdgeKind;
}

export interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

export const TYPE_COLOR: Record<OntologyNodeType, string> = {
  dataset: '#0A97D9',
  indicator: '#4C9F38',
  goal: '#E5243B',
  domain: '#19486A',
};

export const TYPE_RADIUS: Record<OntologyNodeType, number> = {
  dataset: 9,
  indicator: 6,
  goal: 11,
  domain: 14,
};

export const EDGE_KIND_LABEL: Record<OntologyEdgeKind, string> = {
  provides: '제공',
  'maps-to': '매핑',
  'belongs-to': '소속',
};

export const WIDTH = 900;
export const HEIGHT = 620;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 3;
export const SCALE_STEP = 1.25;

export const INITIAL_TRANSFORM: ViewTransform = { scale: 1, tx: 0, ty: 0 };

export function linkEndId(end: string | SimNode): string {
  return typeof end === 'string' ? end : end.id;
}

/** 무방향 엣지 키(노드 id 정렬). path 강조 비교용. */
export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** scale 클램프. */
export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * SVG를 직렬화하여 PNG로 다운로드한다.
 * html2canvas 미사용(Tailwind v4 lab() 이슈, CLAUDE.md) — SVG→canvas drawImage 방식.
 */
export function exportSvgToPng(svg: SVGSVGElement | null, fileName = 'sdg-ontology.png'): void {
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(WIDTH));
  clone.setAttribute('height', String(HEIGHT));
  // opaque background so PNG isn't transparent
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(WIDTH));
  bg.setAttribute('height', String(HEIGHT));
  bg.setAttribute('fill', '#f8fafc');
  clone.insertBefore(bg, clone.firstChild);

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const scale = 2; // retina-ish export
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = fileName;
    a.click();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
