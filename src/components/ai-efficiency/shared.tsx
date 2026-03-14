'use client';

import React, { useState } from 'react';

// ============================================================
// Formatting helpers
// ============================================================

export function formatJo(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}천조원`;
  if (value >= 1) return `${value.toFixed(1)}조원`;
  return `${(value * 10000).toFixed(0)}억원`;
}

export function formatEok(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}조원`;
  return `${Math.round(value).toLocaleString('ko-KR')}억원`;
}

export function formatManWon(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}억원`;
  return `${Math.round(value).toLocaleString('ko-KR')}만원`;
}

export function formatCount(value: number, unit: string): string {
  return `${value.toLocaleString('ko-KR')}${unit}`;
}

// ============================================================
// Slider component
// ============================================================

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  subLabel,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  subLabel?: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-sm text-muted-foreground/70">({subLabel})</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-muted
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}

// ============================================================
// Cell component - displays a metric in a grid
// ============================================================

export function Cell({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="border border-border p-3 md:p-4 min-w-0">
      <div className="text-sm md:text-base text-muted-foreground leading-tight truncate">{label}</div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs md:text-sm text-muted-foreground/60 leading-tight truncate">{sub}</div>}
    </div>
  );
}

// ============================================================
// SectionHeader - full-width grid header
// ============================================================

export function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-border px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

// ============================================================
// InfoSection - collapsible section
// ============================================================

export function InfoSection({ title, color, children, defaultOpen = false }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${color} hover:bg-muted/50 transition-colors text-left`}
      >
        <span className="text-sm md:text-base font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-muted-foreground text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-border bg-muted/10 space-y-4 text-base text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KeyMessage - highlighted message box
// ============================================================

export function KeyMessage({ borderColor, bgColor, titleColor, title, children }: {
  borderColor: string;
  bgColor: string;
  titleColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`border ${borderColor} ${bgColor} p-4 md:p-5 rounded`}>
      <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${titleColor} mb-3`}>
        {title}
      </div>
      <p className="text-base text-foreground/80 leading-relaxed">
        {children}
      </p>
    </div>
  );
}
