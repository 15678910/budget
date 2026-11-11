'use client';

import type { FlowMode } from '@/lib/basic-income/types';

/** 세입을 그해 바로 나눌지(지급), 기금 원금에 넣을지(적립) 고른다. */
export function ModeSelect({ value, onChange, label }: { value: FlowMode; onChange: (m: FlowMode) => void; label: string }) {
  return (
    <select
      aria-label={`${label} 쓰임`}
      className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value === 'pay' ? 'pay' : 'save')}
    >
      <option value="pay">지급용</option>
      <option value="save">적립용</option>
    </select>
  );
}
