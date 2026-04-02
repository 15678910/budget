'use client';

import { useState } from 'react';
import { GLOSSARY } from './types';

// ============================================================
// Cell
// ============================================================

export interface CellProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
  glossaryKey?: string;
}

export function Cell({ label, value, color, sub, glossaryKey }: CellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = glossaryKey ? GLOSSARY[glossaryKey] : undefined;

  return (
    <div
      className="border border-gray-800 p-2 md:p-3 min-w-0 relative"
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-sm md:text-base text-gray-500 leading-tight truncate flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-600 text-[9px] text-gray-500 cursor-help flex-shrink-0">
            ?
          </span>
        )}
      </div>
      <div
        className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs md:text-sm text-gray-600 leading-tight truncate">
          {sub}
        </div>
      )}
      {showTooltip && tooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 md:w-72 p-2.5 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed pointer-events-none">
          <div className="font-semibold text-gray-100 mb-1 text-sm">{glossaryKey}</div>
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// SectionHeader
// ============================================================

export function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

// ============================================================
// Bar
// ============================================================

export function Bar({
  value,
  max,
  colorClass,
  height = 'h-3',
}: {
  value: number;
  max: number;
  colorClass: string;
  height?: string;
}) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full ${height} bg-gray-800 rounded-full overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colorClass} transition-all duration-300`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
