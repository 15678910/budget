'use client';

/** 조기경보 지표판의 컨트롤 줄 — 연도 · 광역/기초 · 시도 · 정렬 */
import { INDICATOR_YEARS, type IndicatorYear } from '@/lib/data/local-indicators-official';
import { REGIONS } from './warning-labels';

export type SortKey = 'headroom' | 'debt' | 'balance';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'headroom', label: '주의 기준 여유 폭 작은 순' },
  { key: 'debt', label: '3년 채무 순증 큰 순' },
  { key: 'balance', label: '통합재정수지 낮은 순' },
];

const CONTROL_CLASS =
  'border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-300 focus:border-gray-500 focus:outline-none';

export interface WarningControlsProps {
  year: IndicatorYear;
  level: 'metro' | 'basic';
  region: string;
  sort: SortKey;
  onYear: (year: IndicatorYear) => void;
  onLevel: (level: 'metro' | 'basic') => void;
  onRegion: (region: string) => void;
  onSort: (sort: SortKey) => void;
}

export function WarningControls({
  year,
  level,
  region,
  sort,
  onYear,
  onLevel,
  onRegion,
  onSort,
}: WarningControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-gray-800 p-3">
      <label className="flex items-center gap-1 text-xs text-gray-500">
        연도
        <select
          className={CONTROL_CLASS}
          value={year}
          onChange={(e) => onYear(Number(e.target.value) as IndicatorYear)}
        >
          {INDICATOR_YEARS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        {(['metro', 'basic'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onLevel(key)}
            className={`border px-3 py-1 text-xs transition-colors ${
              level === key
                ? 'border-gray-600 bg-gray-800/60 text-gray-200'
                : 'border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {key === 'metro' ? '광역 17' : '기초 226'}
          </button>
        ))}
      </div>

      {level === 'basic' && (
        <label className="flex items-center gap-1 text-xs text-gray-500">
          시도
          <select className={CONTROL_CLASS} value={region} onChange={(e) => onRegion(e.target.value)}>
            {REGIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-center gap-1 text-xs text-gray-500">
        정렬
        <select
          className={CONTROL_CLASS}
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
        >
          {SORTS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
