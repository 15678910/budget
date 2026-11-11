'use client';

import { KindBadge } from './KindBadge';
import type { NumberFieldProps } from './types';

function shown(value: number, scale: number): number {
  return Number((value * scale).toFixed(6));
}

/** 숫자 입력칸. 비워 두거나 숫자가 아니면 값을 바꾸지 않는다. */
export function NumberField({ label, value, onChange, unit, scale = 1, step, min, max, sourceKey }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-400">
      <span className="flex items-center gap-1.5">
        {label}
        {sourceKey && <KindBadge sourceKey={sourceKey} />}
      </span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          className="w-full min-w-0 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          value={shown(value, scale)}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n)) onChange(n / scale);
          }}
        />
        {unit && <span className="shrink-0 text-gray-500">{unit}</span>}
      </span>
    </label>
  );
}
