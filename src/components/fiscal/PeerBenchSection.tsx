'use client';

import {
  getPopulationGroupLabel,
  getPeerGroupMetros,
  getPeerGroupStats,
} from '@/lib/data/fiscal-health-data';
import type { PopulationGroup } from './types';
import { SectionHeader } from './primitives';
import { independenceColor, debtColor } from './utils';

export function PeerBenchSection() {
  return (
    <div className="space-y-1">
      <SectionHeader title="인구 규모별 비교 Peer Benchmarking" color="text-purple-400" />

      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-sm text-gray-500 mb-4">
          인구 규모가 비슷한 광역시도끼리 비교하면 더 의미 있는 벤치마킹이 가능합니다
        </div>

        {(['mega', 'large', 'medium', 'small'] as PopulationGroup[]).map((groupKey) => {
          const peerGroups = getPeerGroupMetros();
          const group = peerGroups[groupKey];
          if (group.length === 0) return null;
          const stats = getPeerGroupStats(group);
          return (
            <div key={groupKey} className="mb-4">
              <div className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded-t border border-gray-800">
                <div>
                  <span className="text-base font-bold text-gray-200">{getPopulationGroupLabel(groupKey)}</span>
                  <span className="text-xs text-gray-500 ml-2">{group.length}개 광역시도</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>평균 자립도 <span className={`font-mono font-bold ${independenceColor(stats.avgIndependence)}`}>{stats.avgIndependence.toFixed(1)}%</span></span>
                  <span>평균 1인당채무 <span className="font-mono font-bold text-gray-300">{Math.round(stats.avgDebtPerCapita)}만원</span></span>
                </div>
              </div>

              <div className="border border-gray-800 border-t-0">
                <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-xs text-gray-500 bg-gray-950">
                  <div className="col-span-3">광역시도</div>
                  <div className="col-span-2 text-right">재정자립도</div>
                  <div className="col-span-2 text-right">재정자주도</div>
                  <div className="col-span-2 text-right">1인당 채무</div>
                  <div className="col-span-3 text-right">인구</div>
                </div>
                {group.map((m) => {
                  const pc = (m.debt * 100000000 / m.population) / 10000;
                  const indDiff = m.independence - stats.avgIndependence;
                  return (
                    <div key={m.name} className="grid grid-cols-12 gap-1 px-3 py-1.5 border-t border-gray-800/50 items-center">
                      <div className="col-span-3 text-sm font-bold text-gray-300 truncate">
                        {m.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-mono font-bold ${independenceColor(m.independence)}`}>{m.independence.toFixed(1)}%</span>
                        <span className={`text-xs font-mono ml-1 ${indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {indDiff >= 0 ? '+' : ''}{indDiff.toFixed(1)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-mono font-bold text-blue-400">{m.autonomy.toFixed(1)}%</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-mono font-bold ${debtColor(pc)}`}>{Math.round(pc)}만원</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm font-mono text-gray-400">{(m.population / 10000).toFixed(0)}만명</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 그룹 간 비교 요약 */}
      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-base font-bold text-gray-300 mb-3">그룹 간 비교 요약</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['mega', 'large', 'medium', 'small'] as PopulationGroup[]).map((groupKey) => {
            const group = getPeerGroupMetros()[groupKey];
            if (group.length === 0) return null;
            const stats = getPeerGroupStats(group);
            return (
              <div key={groupKey} className="border border-gray-800 p-3 space-y-1">
                <div className="text-sm font-bold text-gray-300">{getPopulationGroupLabel(groupKey)}</div>
                <div className="text-xs text-gray-500">{group.length}개 지역</div>
                <div className="space-y-0.5 pt-1 border-t border-gray-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">평균 자립도</span>
                    <span className={`font-mono font-bold ${independenceColor(stats.avgIndependence)}`}>{stats.avgIndependence.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">평균 자주도</span>
                    <span className="font-mono font-bold text-blue-400">{stats.avgAutonomy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">평균 1인당채무</span>
                    <span className="font-mono font-bold text-gray-300">{Math.round(stats.avgDebtPerCapita)}만원</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
