"use client";

import { CHANGE_COLOR_SCALE, NEW_ITEM_COLOR, NEW_ITEM_LABEL } from '@/lib/utils/change-colors';

interface BubbleLegendProps {
  maxAmount: number;
}

/** Format amount in 백만원 to a short label */
function shortLabel(amountInMillions: number): string {
  if (amountInMillions >= 1_000_000) return `${(amountInMillions / 1_000_000).toFixed(0)}조`;
  if (amountInMillions >= 100) return `${Math.round(amountInMillions / 100).toLocaleString()}억`;
  return `${amountInMillions}백만`;
}

export function BubbleLegend({ maxAmount }: BubbleLegendProps) {
  // Size legend circles
  const sizeSteps = [
    maxAmount * 0.01,
    maxAmount * 0.05,
    maxAmount * 0.2,
  ].filter(v => v > 0);

  return (
    <div className="flex flex-wrap items-end gap-6 px-3 py-2 text-xs text-muted-foreground">
      {/* Color legend */}
      <div className="flex items-center gap-1">
        <span className="mr-1 font-medium">변동률:</span>
        <div
          className="w-3 h-3 rounded-full border border-border"
          style={{ backgroundColor: NEW_ITEM_COLOR }}
          title={NEW_ITEM_LABEL}
        />
        <span className="mr-2">{NEW_ITEM_LABEL}</span>
        {CHANGE_COLOR_SCALE.map((stop, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <div
              className="w-3 h-3 rounded-full border border-border"
              style={{ backgroundColor: stop.color }}
              title={stop.label}
            />
            {i === 0 || i === 3 || i === CHANGE_COLOR_SCALE.length - 1 ? (
              <span className="text-[10px]">{stop.label}</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Size legend */}
      <div className="flex items-end gap-3">
        <span className="font-medium">크기:</span>
        {sizeSteps.map((amount, i) => {
          const r = Math.max(4, 3 + i * 6);
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className="rounded-full border border-muted-foreground/30"
                style={{
                  width: r * 2,
                  height: r * 2,
                  backgroundColor: 'hsl(var(--muted))',
                }}
              />
              <span className="text-[10px]">{shortLabel(amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
