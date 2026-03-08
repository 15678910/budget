'use client';

import { useState, useMemo, useEffect } from 'react';
import { BudgetTreeNode } from '@/types/budget';
import {
  extractMetroEntity,
  extractDistrictEntity,
  extractEducationEntity,
  getMetroNames,
  getDistrictNames,
  getEducationNames,
  buildEntityComparison,
  EntityData,
  EntityComparison,
} from '@/lib/utils/extract-entity';
import { getRegionColor } from '@/lib/utils/regional-colors';
import { getEducationColor } from '@/lib/utils/education-colors';
import { formatKoreanWon } from '@/lib/utils/format';
import { DataSources } from '@/components/shared/DataSources';

/* ---------- Types ---------- */

type CompareMode = 'metro' | 'district' | 'education';

interface Props {
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  educationDataByYear: Record<number, BudgetTreeNode>;
  availableYears: number[];
  defaultYear: number;
}

const MODES: { key: CompareMode; label: string }[] = [
  { key: 'metro', label: '광역별' },
  { key: 'district', label: '자치구별' },
  { key: 'education', label: '교육청별' },
];

const SELECT_CLASS =
  'bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';

/* ---------- Sub-components ---------- */

/** Format per-capita amount (백만원 → 원/인) */
function formatPerCapita(amountInMillions: number, population: number): string {
  if (!population) return '-';
  const won = (amountInMillions * 1_000_000) / population;
  if (won >= 10_000_000) return `${(won / 10_000_000).toFixed(1)}천만원`;
  if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString('ko-KR')}만원`;
  return `${Math.round(won).toLocaleString('ko-KR')}원`;
}

/** Shorten metro/education name (e.g. "서울특별시" → "서울") */
function shortMetro(name: string): string {
  if (name.includes('교육청'))
    return name.replace(/특별시교육청|광역시교육청|특별자치시교육청|특별자치도교육청|도교육청/, '');
  return name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
}

/** Shorten entity name for compact display, using both names to disambiguate */
function shortName(nameA: string, nameB: string): [string, string] {
  // District: "서울특별시 강남구" → check if same metro
  if (nameA.includes(' ') && nameB.includes(' ')) {
    const [metroA, distA] = [nameA.split(' ')[0], nameA.split(' ').slice(1).join(' ')];
    const [metroB, distB] = [nameB.split(' ')[0], nameB.split(' ').slice(1).join(' ')];
    if (metroA === metroB) {
      // Same metro: "강남구" vs "서초구"
      return [distA, distB];
    }
    // Different metro and same district name (e.g. both "본청")
    if (distA === distB) {
      return [`${shortMetro(metroA)} ${distA}`, `${shortMetro(metroB)} ${distB}`];
    }
    return [distA, distB];
  }
  return [shortMetro(nameA), shortMetro(nameB)];
}

function CompareCell({
  comparison,
  maxAmount,
  colorA,
  colorB,
  labelA,
  labelB,
  popA,
  popB,
}: {
  comparison: EntityComparison;
  maxAmount: number;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
  popA: number;
  popB: number;
}) {
  const barWidthA = (comparison.amountA / maxAmount) * 100;
  const barWidthB = (comparison.amountB / maxAmount) * 100;

  return (
    <div className="border border-gray-800 p-2 md:p-3 min-w-0">
      <div className="text-[10px] md:text-xs text-gray-400 leading-tight truncate mb-1">
        {comparison.categoryName}
      </div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: colorA }}
        />
        <span className="text-[9px] font-medium flex-shrink-0" style={{ color: colorA }}>{labelA}</span>
        <span
          className="text-xs md:text-sm font-mono font-bold tabular-nums truncate"
          style={{ color: colorA }}
        >
          {formatKoreanWon(comparison.amountA)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: colorB }}
        />
        <span className="text-[9px] font-medium flex-shrink-0" style={{ color: colorB }}>{labelB}</span>
        <span
          className="text-xs md:text-sm font-mono font-bold tabular-nums truncate"
          style={{ color: colorB }}
        >
          {formatKoreanWon(comparison.amountB)}
        </span>
      </div>
      <div className="text-[9px] text-gray-500 mb-0.5 truncate">
        구성비 {comparison.shareA.toFixed(1)}% / {comparison.shareB.toFixed(1)}%
      </div>
      {/* Per-capita */}
      {popA > 0 && popB > 0 && (
        <div className="text-[9px] text-gray-500 mb-1 truncate">
          1인당 {formatPerCapita(comparison.amountA, popA)} / {formatPerCapita(comparison.amountB, popB)}
        </div>
      )}
      {/* Mini bar chart with labels */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[8px] w-6 text-right flex-shrink-0" style={{ color: colorA }}>{labelA}</span>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex-1">
            <div
              className="h-full rounded-full"
              style={{ width: `${barWidthA}%`, backgroundColor: colorA }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] w-6 text-right flex-shrink-0" style={{ color: colorB }}>{labelB}</span>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex-1">
            <div
              className="h-full rounded-full"
              style={{ width: `${barWidthB}%`, backgroundColor: colorB }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityPicker({
  label,
  names,
  value,
  onChange,
  color,
}: {
  label: string;
  names: string[];
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        title={label}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
        aria-label={label}
      >
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

function DistrictPicker({
  label,
  metroNames,
  districtNames,
  metroValue,
  districtValue,
  onMetroChange,
  onDistrictChange,
  color,
}: {
  label: string;
  metroNames: string[];
  districtNames: string[];
  metroValue: string;
  districtValue: string;
  onMetroChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        title={label}
      />
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
        <select
          value={metroValue}
          onChange={(e) => onMetroChange(e.target.value)}
          className={SELECT_CLASS}
          aria-label={`${label} 시도`}
        >
          {metroNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={districtValue}
          onChange={(e) => onDistrictChange(e.target.value)}
          className={SELECT_CLASS}
          aria-label={`${label} 시군구`}
        >
          {districtNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */

export function RegionalCompareDashboard({
  metroDataByYear,
  districtDataByYear,
  educationDataByYear,
  availableYears,
  defaultYear,
}: Props) {
  const [year, setYear] = useState(defaultYear);
  const [mode, setMode] = useState<CompareMode>('metro');

  // Metro mode state
  const [metroA, setMetroA] = useState('');
  const [metroB, setMetroB] = useState('');

  // District mode state
  const [distMetroA, setDistMetroA] = useState('');
  const [distMetroB, setDistMetroB] = useState('');
  const [distA, setDistA] = useState('');
  const [distB, setDistB] = useState('');

  // Education mode state
  const [eduA, setEduA] = useState('');
  const [eduB, setEduB] = useState('');

  /* --- Derived name lists --- */

  const metroTree = metroDataByYear[year];
  const districtTree = districtDataByYear[year];
  const educationTree = educationDataByYear[year];

  const metroNames = useMemo(
    () => (metroTree ? getMetroNames(metroTree) : []),
    [metroTree],
  );

  const distMetroNames = useMemo(
    () => (districtTree ? getMetroNames(districtTree) : []),
    [districtTree],
  );

  const distNamesA = useMemo(
    () =>
      districtTree && distMetroA
        ? getDistrictNames(districtTree, distMetroA)
        : [],
    [districtTree, distMetroA],
  );

  const distNamesB = useMemo(
    () =>
      districtTree && distMetroB
        ? getDistrictNames(districtTree, distMetroB)
        : [],
    [districtTree, distMetroB],
  );

  const educationNames = useMemo(
    () => (educationTree ? getEducationNames(educationTree) : []),
    [educationTree],
  );

  /* --- Initialize defaults when mode/year/data changes --- */

  useEffect(() => {
    if (mode === 'metro' && metroNames.length >= 2) {
      setMetroA(metroNames[0]);
      setMetroB(metroNames[1]);
    }
  }, [mode, metroNames]);

  useEffect(() => {
    if (mode === 'district' && distMetroNames.length >= 1) {
      setDistMetroA(distMetroNames[0]);
      if (distMetroNames.length >= 2) {
        setDistMetroB(distMetroNames[1]);
      } else {
        setDistMetroB(distMetroNames[0]);
      }
    }
  }, [mode, distMetroNames]);

  // When distMetroA changes, reset distA to first district
  useEffect(() => {
    if (distNamesA.length > 0) {
      setDistA(distNamesA[0]);
    }
  }, [distNamesA]);

  // When distMetroB changes, reset distB to first district (or second if same metro)
  useEffect(() => {
    if (distNamesB.length > 0) {
      if (distMetroA === distMetroB && distNamesB.length >= 2) {
        setDistB(distNamesB[1]);
      } else {
        setDistB(distNamesB[0]);
      }
    }
  }, [distNamesB, distMetroA, distMetroB]);

  useEffect(() => {
    if (mode === 'education' && educationNames.length >= 2) {
      setEduA(educationNames[0]);
      setEduB(educationNames[1]);
    }
  }, [mode, educationNames]);

  /* --- Color helper --- */

  function getEntityColor(name: string): string {
    if (mode === 'education') return getEducationColor(name);
    // For district entities like "서울특별시 강남구", extract metro portion
    return getRegionColor(name.split(' ')[0] || name);
  }

  /* --- Computed comparison data --- */

  const { entityA, entityB, comparisons } = useMemo(() => {
    let a: EntityData | null = null;
    let b: EntityData | null = null;

    if (mode === 'metro') {
      const tree = metroDataByYear[year];
      if (tree && metroA) a = extractMetroEntity(tree, metroA);
      if (tree && metroB) b = extractMetroEntity(tree, metroB);
    } else if (mode === 'district') {
      const tree = districtDataByYear[year];
      if (tree && distMetroA && distA)
        a = extractDistrictEntity(tree, distMetroA, distA);
      if (tree && distMetroB && distB)
        b = extractDistrictEntity(tree, distMetroB, distB);
    } else {
      const tree = educationDataByYear[year];
      if (tree && eduA) a = extractEducationEntity(tree, eduA);
      if (tree && eduB) b = extractEducationEntity(tree, eduB);
    }

    const comps = a && b ? buildEntityComparison(a, b) : [];
    return { entityA: a, entityB: b, comparisons: comps };
  }, [
    mode,
    year,
    metroA,
    metroB,
    distMetroA,
    distMetroB,
    distA,
    distB,
    eduA,
    eduB,
    metroDataByYear,
    districtDataByYear,
    educationDataByYear,
  ]);

  const colorA = entityA ? getEntityColor(entityA.name) : '#666';
  const colorB = entityB ? getEntityColor(entityB.name) : '#666';

  const maxAmount = Math.max(
    ...comparisons.map((c) => Math.max(c.amountA, c.amountB)),
    1,
  );

  /* --- Summary values --- */

  const delta =
    entityA && entityB ? entityB.totalAmount - entityA.totalAmount : 0;
  const ratio = useMemo(() => {
    if (!entityA || !entityB) return 0;
    const bigger = Math.max(entityA.totalAmount, entityB.totalAmount);
    const smaller = Math.min(entityA.totalAmount, entityB.totalAmount);
    return smaller > 0 ? bigger / smaller : 0;
  }, [entityA, entityB]);

  /* --- District-mode color helpers --- */

  const colorDistA = distMetroA ? getRegionColor(distMetroA) : '#666';
  const colorDistB = distMetroB ? getRegionColor(distMetroB) : '#666';

  /* --- Short labels for cells --- */
  const [labelA, labelB] = entityA && entityB
    ? shortName(entityA.name, entityB.name)
    : ['', ''];

  /* --- Render --- */

  return (
    <div className="bg-gray-950 text-gray-100 rounded-lg overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <h2 className="text-lg font-bold tracking-tight">
          지방재정 비교 대시보드
        </h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-gray-800 text-gray-200 px-3 py-1 rounded text-sm border border-gray-700"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Entity selectors */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-4 border-b border-gray-800">
        {/* Left entity picker */}
        {mode === 'metro' && (
          <EntityPicker
            label="비교 대상 A"
            names={metroNames}
            value={metroA}
            onChange={setMetroA}
            color={colorA}
          />
        )}
        {mode === 'district' && (
          <DistrictPicker
            label="비교 대상 A"
            metroNames={distMetroNames}
            districtNames={distNamesA}
            metroValue={distMetroA}
            districtValue={distA}
            onMetroChange={setDistMetroA}
            onDistrictChange={setDistA}
            color={colorDistA}
          />
        )}
        {mode === 'education' && (
          <EntityPicker
            label="비교 대상 A"
            names={educationNames}
            value={eduA}
            onChange={setEduA}
            color={colorA}
          />
        )}

        <span className="text-gray-500 text-lg font-bold">vs</span>

        {/* Right entity picker */}
        {mode === 'metro' && (
          <EntityPicker
            label="비교 대상 B"
            names={metroNames}
            value={metroB}
            onChange={setMetroB}
            color={colorB}
          />
        )}
        {mode === 'district' && (
          <DistrictPicker
            label="비교 대상 B"
            metroNames={distMetroNames}
            districtNames={distNamesB}
            metroValue={distMetroB}
            districtValue={distB}
            onMetroChange={setDistMetroB}
            onDistrictChange={setDistB}
            color={colorDistB}
          />
        )}
        {mode === 'education' && (
          <EntityPicker
            label="비교 대상 B"
            names={educationNames}
            value={eduB}
            onChange={setEduB}
            color={colorB}
          />
        )}
      </div>

      {/* Summary row */}
      {entityA && entityB ? (
        <>
          {/* Budget totals */}
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="border border-gray-800 p-2 md:p-3">
              <div className="text-[10px] text-gray-500 truncate">
                {entityA.name} 총예산
              </div>
              <div
                className="text-sm md:text-base font-mono font-bold"
                style={{ color: colorA }}
              >
                {formatKoreanWon(entityA.totalAmount)}
              </div>
            </div>
            <div className="border border-gray-800 p-2 md:p-3">
              <div className="text-[10px] text-gray-500 truncate">
                {entityB.name} 총예산
              </div>
              <div
                className="text-sm md:text-base font-mono font-bold"
                style={{ color: colorB }}
              >
                {formatKoreanWon(entityB.totalAmount)}
              </div>
            </div>
            <div className="border border-gray-800 p-2 md:p-3">
              <div className="text-[10px] text-gray-500">차이</div>
              <div
                className={`text-sm md:text-base font-mono font-bold ${
                  delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {formatKoreanWon(delta)}
              </div>
            </div>
            <div className="border border-gray-800 p-2 md:p-3">
              <div className="text-[10px] text-gray-500">배율</div>
              <div className="text-sm md:text-base font-mono font-bold text-amber-400">
                {ratio > 0 ? `${ratio.toFixed(2)}배` : '-'}
              </div>
            </div>
          </div>

          {/* Per-capita section */}
          {entityA.population > 0 && entityB.population > 0 && (
            <>
              <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                <span className="text-[10px] md:text-xs font-semibold text-orange-400 uppercase tracking-widest">
                  1인당 예산 비교
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500 truncate">{entityA.name} 인구</div>
                  <div className="text-sm md:text-base font-mono font-bold text-gray-300">
                    {(entityA.population / 10_000).toFixed(1)}만명
                  </div>
                </div>
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500 truncate">{entityB.name} 인구</div>
                  <div className="text-sm md:text-base font-mono font-bold text-gray-300">
                    {(entityB.population / 10_000).toFixed(1)}만명
                  </div>
                </div>
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500 truncate">{entityA.name} 1인당</div>
                  <div className="text-sm md:text-base font-mono font-bold" style={{ color: colorA }}>
                    {formatPerCapita(entityA.totalAmount, entityA.population)}
                  </div>
                </div>
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500 truncate">{entityB.name} 1인당</div>
                  <div className="text-sm md:text-base font-mono font-bold" style={{ color: colorB }}>
                    {formatPerCapita(entityB.totalAmount, entityB.population)}
                  </div>
                </div>
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500">1인당 차이</div>
                  {(() => {
                    const pcA = (entityA.totalAmount * 1_000_000) / entityA.population;
                    const pcB = (entityB.totalAmount * 1_000_000) / entityB.population;
                    const pcDelta = pcB - pcA;
                    return (
                      <div className={`text-sm md:text-base font-mono font-bold ${pcDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pcDelta >= 0 ? '+' : ''}{Math.abs(pcDelta) >= 10_000
                          ? `${Math.round(pcDelta / 10_000).toLocaleString('ko-KR')}만원`
                          : `${Math.round(pcDelta).toLocaleString('ko-KR')}원`}
                      </div>
                    );
                  })()}
                </div>
                <div className="border border-gray-800 p-2 md:p-3">
                  <div className="text-[10px] text-gray-500">1인당 배율</div>
                  {(() => {
                    const pcA = (entityA.totalAmount * 1_000_000) / entityA.population;
                    const pcB = (entityB.totalAmount * 1_000_000) / entityB.population;
                    const pcRatio = Math.min(pcA, pcB) > 0 ? Math.max(pcA, pcB) / Math.min(pcA, pcB) : 0;
                    return (
                      <div className="text-sm md:text-base font-mono font-bold text-amber-400">
                        {pcRatio > 0 ? `${pcRatio.toFixed(2)}배` : '-'}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          비교할 두 개의 항목을 선택하세요
        </div>
      )}

      {/* Section header */}
      {comparisons.length > 0 && (
        <>
          <div className="px-3 py-1.5 bg-gray-900 border-b border-gray-800">
            <span className="text-[10px] md:text-xs font-semibold text-cyan-400 uppercase tracking-widest">
              기능별 세출 비교
            </span>
          </div>

          {/* Category comparison grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {comparisons.map((c) => (
              <CompareCell
                key={c.categoryName}
                comparison={c}
                maxAmount={maxAmount}
                colorA={colorA}
                colorB={colorB}
                labelA={labelA}
                labelB={labelB}
                popA={entityA?.population ?? 0}
                popB={entityB?.population ?? 0}
              />
            ))}
          </div>
        </>
      )}

      {/* Legend */}
      {entityA && entityB && (
        <div className="flex items-center justify-center gap-6 px-4 py-3 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colorA }}
            />
            <span className="text-xs text-gray-400">{entityA.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colorB }}
            />
            <span className="text-xs text-gray-400">{entityB.name}</span>
          </div>
        </div>
      )}

      {/* Data sources */}
      <div className="border-t border-gray-800">
        <DataSources />
      </div>
    </div>
  );
}
