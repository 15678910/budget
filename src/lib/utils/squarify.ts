import type { BudgetTreeNode } from '@/types/budget';

export interface SquarifyRect {
  name: string;
  value: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: BudgetTreeNode['meta'];
}

export interface SquarifyInput {
  name: string;
  value: number;
  color: string;
  meta?: BudgetTreeNode['meta'];
}

/**
 * Squarify treemap layout algorithm.
 * Given a list of items with values and a bounding rectangle,
 * computes positioned rectangles that tile the area proportionally
 * with aspect ratios as close to 1:1 as possible.
 */
export function squarify(
  items: SquarifyInput[],
  x: number,
  y: number,
  width: number,
  height: number,
): SquarifyRect[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0 || items.length === 0) return [];

  const rects: SquarifyRect[] = [];
  let remaining = [...items];
  let cx = x, cy = y, cw = width, ch = height;

  while (remaining.length > 0) {
    const isHorizontal = cw >= ch;
    const side = isHorizontal ? ch : cw;
    const remTotal = remaining.reduce((s, i) => s + i.value, 0);

    // Find the best row
    let row: typeof remaining = [];
    let bestRatio = Infinity;

    for (let i = 1; i <= remaining.length; i++) {
      const candidate = remaining.slice(0, i);
      const rowTotal = candidate.reduce((s, item) => s + item.value, 0);
      const rowWidth = (rowTotal / remTotal) * (isHorizontal ? cw : ch);

      let worstRatio = 0;
      for (const item of candidate) {
        const itemHeight = (item.value / rowTotal) * side;
        const ratio = Math.max(rowWidth / itemHeight, itemHeight / rowWidth);
        worstRatio = Math.max(worstRatio, ratio);
      }

      if (worstRatio <= bestRatio) {
        bestRatio = worstRatio;
        row = candidate;
      } else {
        break;
      }
    }

    // Layout the row
    const rowTotal = row.reduce((s, item) => s + item.value, 0);
    const rowSize = (rowTotal / remTotal) * (isHorizontal ? cw : ch);

    let offset = 0;
    for (const item of row) {
      const itemSize = (item.value / rowTotal) * side;

      if (isHorizontal) {
        rects.push({
          name: item.name,
          value: item.value,
          color: item.color,
          meta: item.meta,
          x: cx,
          y: cy + offset,
          width: rowSize,
          height: itemSize,
        });
      } else {
        rects.push({
          name: item.name,
          value: item.value,
          color: item.color,
          meta: item.meta,
          x: cx + offset,
          y: cy,
          width: itemSize,
          height: rowSize,
        });
      }
      offset += itemSize;
    }

    // Update remaining area
    if (isHorizontal) {
      cx += rowSize;
      cw -= rowSize;
    } else {
      cy += rowSize;
      ch -= rowSize;
    }

    remaining = remaining.slice(row.length);
  }

  return rects;
}

/** Recursively calculate total value of a BudgetTreeNode */
export function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/** Darken a hex color by a factor (0-1, where 0 = original, 1 = black) */
export function darken(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - factor));
  return `rgb(${r},${g},${b})`;
}
