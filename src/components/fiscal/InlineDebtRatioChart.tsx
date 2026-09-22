'use client';

import {
  getMetroDebtHistoryOfficial,
  getDistrictDebtHistoryOfficial,
} from '@/lib/data/fiscal-health-official';
import type { DebtSourceTag } from '@/lib/data/fiscal-health-official';
import type { MetroFiscalData, DistrictFiscalData } from './types';
import {
  independenceColor,
  formatDebt,
  formatDebtPerCapita,
} from './utils';

type ChartEntry = { year: number; ratio: number };

export function InlineDebtRatioChart({
  globalMetro,
  globalDistrict,
  metroData,
  allDistricts,
}: {
  globalMetro: string;
  globalDistrict: string;
  metroData: MetroFiscalData[];
  allDistricts: (DistrictFiscalData & { debtSource?: DebtSourceTag })[];
}) {
  const metro = metroData.find(m => m.name === globalMetro);
  if (!metro) return null;

  const selectedDistrict = globalDistrict !== '전체'
    ? allDistricts.find(d => d.metro === globalMetro && d.name === globalDistrict)
    : null;

  const districtIsEstimated = selectedDistrict?.debtSource === 'estimated';
  const chartLabel = selectedDistrict ? `${globalMetro} ${selectedDistrict.name}` : globalMetro;
  const chartSubLabel = selectedDistrict
    ? districtIsEstimated
      ? '예산 대비 채무비율 추이 (광역 패턴 기반 추정)'
      : '예산 대비 채무비율 추이 (지방재정365 결산)'
    : '예산 대비 채무비율 추이';

  let history: ChartEntry[];
  if (selectedDistrict) {
    history = getDistrictDebtHistoryOfficial(selectedDistrict).map(h => ({ year: h.year, ratio: h.ratio }));
  } else {
    history = getMetroDebtHistoryOfficial(globalMetro).map(h => ({ year: h.year, ratio: h.ratio }));
  }

  const infoEntity = selectedDistrict ?? metro;
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const first = history.length > 0 ? history[0] : null;
  // 연도가 1개 이하면 x축 분모(length-1)가 0이라 좌표가 NaN이 된다. 차트를 그리지 않는다.
  const series =
    history.length >= 2 && first && latest
      ? { first, latest, change: latest.ratio - first.ratio }
      : null;

  return (
    <div className="border border-gray-800 p-3 md:p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-200">{chartLabel}</span>
          <span className="text-sm text-gray-500">
            {chartSubLabel}{series ? ` (${series.first.year}~${series.latest.year})` : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {latest && (
            <span className={`text-xl font-mono font-bold ${latest.ratio > 15 ? 'text-red-400' : latest.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {latest.ratio.toFixed(1)}%
            </span>
          )}
          {series && (
            <span className={`text-sm ${series.change === 0 ? 'text-gray-500' : series.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {series.change === 0 ? '—' : series.change > 0 ? '▲' : '▼'} {Math.abs(series.change).toFixed(1)}%p ({series.first.year}→{series.latest.year})
            </span>
          )}
        </div>
      </div>
      {selectedDistrict && districtIsEstimated && (
        <div className="text-xs text-gray-600">※ 광역시도 실제 채무비율 변동 패턴을 시군구에 적용한 추정치입니다</div>
      )}
      {series ? (
        <DebtRatioSeriesSvg history={history} latestRatio={series.latest.ratio} />
      ) : (
        <div className="text-sm text-gray-500 py-4">
          이력 자료 없음 — 공시된 연도가 2개 미만이라 추이를 그릴 수 없습니다.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-gray-500 text-xs">재정자립도</div>
          <div className={`font-bold ${independenceColor(infoEntity.independence)}`}>{infoEntity.independence}%</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-gray-500 text-xs">재정자주도</div>
          <div className="font-bold text-blue-400">{infoEntity.autonomy}%</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-gray-500 text-xs">지역채무</div>
          <div className="font-bold text-red-400">{formatDebt(infoEntity.debt)}</div>
        </div>
        <div className="border border-gray-800 p-2 text-center">
          <div className="text-gray-500 text-xs">1인당 채무</div>
          <div className="font-bold text-amber-400">{formatDebtPerCapita(infoEntity.debt, infoEntity.population)}</div>
        </div>
      </div>
    </div>
  );
}

/** 채무비율 추이 SVG. 호출부가 history.length >= 2를 보장한다 */
function DebtRatioSeriesSvg({ history, latestRatio }: { history: ChartEntry[]; latestRatio: number }) {
  const W = 800, H = 320;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const ratios = history.map(h => h.ratio);
  const minY = Math.floor(Math.min(...ratios) / 2) * 2;
  const maxY = Math.ceil(Math.max(...ratios) / 2) * 2 + 2;
  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;
  const linePath = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L ${xScale(history.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;
  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 2) yTicks.push(v);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: '360px' }}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#374151" strokeWidth="1" strokeDasharray={v === minY ? 'none' : '4,4'} />
            <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize="12" fontFamily="monospace">{v}%</text>
          </g>
        ))}
        <defs>
          <linearGradient id="inlineMetroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={latestRatio > 15 ? '#ef4444' : latestRatio > 10 ? '#f59e0b' : '#10b981'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={latestRatio > 15 ? '#ef4444' : latestRatio > 10 ? '#f59e0b' : '#10b981'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#inlineMetroGrad)" opacity="0.3" />
        <path d={linePath} fill="none" stroke={latestRatio > 15 ? '#ef4444' : latestRatio > 10 ? '#f59e0b' : '#10b981'} strokeWidth="2.5" />
        {history.map((h, i) => (
          <g key={h.year}>
            <circle cx={xScale(i)} cy={yScale(h.ratio)} r="4" fill={h.ratio > 15 ? '#ef4444' : h.ratio > 10 ? '#f59e0b' : '#10b981'} />
            <text x={xScale(i)} y={yScale(h.ratio) - 10} textAnchor="middle" fill={h.ratio > 15 ? '#ef4444' : h.ratio > 10 ? '#f59e0b' : '#10b981'} fontSize="11" fontFamily="monospace" fontWeight="bold">
              {h.ratio.toFixed(1)}%
            </text>
            <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="11">{h.year}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
