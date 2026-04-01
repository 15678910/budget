import type { BudgetTreeNode, ViewMode } from '@/types/budget';
import { getNodeColor } from '@/lib/utils/colors';
import { squarify, calculateTotal, darken } from '@/lib/utils/squarify';

interface SSRTreemapProps {
  data: BudgetTreeNode;
  viewMode: ViewMode;
}

/** Fixed dimensions for server-side rendering (no DOM measurement available) */
const SSR_WIDTH = 1200;
const SSR_HEIGHT = 600;

/**
 * Server-rendered treemap using the squarify algorithm with pure HTML/CSS.
 * Acts as the LCP element — paints immediately in the first HTML response.
 * Hidden once the interactive client treemap loads.
 */
export function SSRTreemap({ data, viewMode }: SSRTreemapProps) {
  const total = calculateTotal(data);
  if (!data.children || data.children.length === 0 || total === 0) return null;

  const items = data.children
    .map(child => ({
      name: child.name,
      value: calculateTotal(child),
      color: getNodeColor(child.name, viewMode),
      meta: child.meta,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const rects = squarify(items, 0, 0, SSR_WIDTH, SSR_HEIGHT);

  return (
    <div
      id="ssr-treemap"
      className="border border-border rounded-lg overflow-hidden relative"
      style={{
        height: 'calc(100vh - 280px)',
        minHeight: '400px',
      }}
    >
      {rects.map((rect) => {
        // Convert absolute pixel positions to percentages for responsive sizing
        const leftPct = (rect.x / SSR_WIDTH) * 100;
        const topPct = (rect.y / SSR_HEIGHT) * 100;
        const widthPct = (rect.width / SSR_WIDTH) * 100;
        const heightPct = (rect.height / SSR_HEIGHT) * 100;
        const showLabel = widthPct > 5 && heightPct > 5;

        return (
          <div
            key={rect.name}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              backgroundColor: rect.color,
              borderWidth: 2,
              borderColor: darken(rect.color, 0.3),
            }}
            className="border flex items-center justify-center overflow-hidden"
          >
            {showLabel && (
              <span
                style={{ color: darken(rect.color, 0.65) }}
                className="text-xs font-medium pointer-events-none select-none truncate px-1"
              >
                {rect.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
