import type { BudgetTreeNode, ViewMode } from '@/types/budget';
import { getNodeColor } from '@/lib/utils/colors';

interface SSRTreemapProps {
  data: BudgetTreeNode;
  viewMode: ViewMode;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/**
 * Server-rendered treemap using pure HTML/CSS (no JS required).
 * Acts as the LCP element — paints immediately in the first HTML response.
 * Hidden once the interactive recharts treemap loads on the client.
 */
export function SSRTreemap({ data, viewMode }: SSRTreemapProps) {
  const total = calculateTotal(data);
  if (!data.children || data.children.length === 0 || total === 0) return null;

  const items = data.children
    .map(child => ({
      name: child.name,
      value: calculateTotal(child),
      color: getNodeColor(child.name, viewMode),
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div
      id="ssr-treemap"
      className="border border-border rounded-lg overflow-hidden"
      style={{
        height: 'calc(100vh - 280px)',
        minHeight: '400px',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
      }}
    >
      {items.map((item) => {
        const pct = (item.value / total) * 100;
        const isLarge = pct > 15;
        return (
          <div
            key={item.name}
            style={{
              width: isLarge ? '100%' : `${Math.max(pct * 2, 10)}%`,
              height: isLarge ? `${pct * 1.5}%` : `${Math.max(pct * 3, 8)}%`,
              backgroundColor: item.color,
              minHeight: '30px',
            }}
            className="flex items-center justify-center p-1 border border-black/10 relative overflow-hidden"
          >
            <span className="text-xs font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] truncate">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
