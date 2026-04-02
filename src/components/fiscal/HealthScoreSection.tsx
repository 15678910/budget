'use client';

import {
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
  gradeColor,
  gradeBgColor,
  gradeEmoji,
} from '@/lib/data/fiscal-health-data';
import { DataDownload } from '@/components/shared/DataDownload';
import type { MetroFiscalData, DistrictFiscalData } from './types';
import { SectionHeader } from './primitives';

export function HealthScoreSection({
  globalMetro,
  metroData,
  allDistricts,
}: {
  globalMetro: string;
  metroData: MetroFiscalData[];
  allDistricts: DistrictFiscalData[];
}) {
  return (
    <div className="space-y-1">
      <SectionHeader title="재정건전성 점수 Fiscal Health Score" color="text-emerald-400" />
      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-sm text-gray-500 mb-3">
          재정자립도(30점) + 재정자주도(25점) + 채무비율(25점) + 1인당채무(20점) = 100점 만점
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(globalMetro === '전체' ? metroData : metroData.filter(m => m.name === globalMetro)).map((metro) => {
            const score = calculateFiscalHealthScore(metro);
            return (
              <div key={metro.name} className="border border-gray-800 p-3 space-y-2 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-300 truncate">{metro.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}</span>
                  <span className="text-lg">{gradeEmoji(score.grade)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-mono font-bold ${gradeColor(score.grade)}`}>{score.total}</span>
                  <span className="text-sm text-gray-500">/ 100점</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-bold ${gradeBgColor(score.grade)} text-gray-950`}>
                    {score.grade}등급
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${gradeBgColor(score.grade)} transition-all`} style={{ width: `${score.total}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">자립도</span>
                    <span className="font-mono text-gray-300">{score.breakdown.independence}/30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">자주도</span>
                    <span className="font-mono text-gray-300">{score.breakdown.autonomy}/25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">채무비율</span>
                    <span className="font-mono text-gray-300">{score.breakdown.debtRatio}/25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">1인당채무</span>
                    <span className="font-mono text-gray-300">{score.breakdown.debtPerCapita}/20</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 등급 범례 */}
      <div className="flex items-center justify-center gap-4 border border-gray-800 px-3 py-2 flex-wrap">
        {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
          <div key={g} className="flex items-center gap-1.5">
            <span className="text-base">{gradeEmoji(g)}</span>
            <span className={`text-sm font-bold ${gradeColor(g)}`}>{g}</span>
            <span className="text-xs text-gray-600">
              {g === 'A' ? '80+' : g === 'B' ? '65~79' : g === 'C' ? '50~64' : g === 'D' ? '35~49' : '~34'}
            </span>
          </div>
        ))}
      </div>

      {/* 다운로드 */}
      <div className="flex justify-end border border-gray-800 px-3 py-2">
        <DataDownload
          data={metroData.map((m) => {
            const s = calculateFiscalHealthScore(m);
            return {
              광역시도: m.name,
              총점: s.total,
              등급: s.grade,
              '자립도점수': s.breakdown.independence,
              '자주도점수': s.breakdown.autonomy,
              '채무비율점수': s.breakdown.debtRatio,
              '1인당채무점수': s.breakdown.debtPerCapita,
            };
          })}
          filename="재정건전성점수_2025"
        />
      </div>

      {/* ── 시군구 건전성 점수 ── */}
      <div className="border-t-2 border-gray-700 mt-4 pt-3">
        <SectionHeader title="시군구 건전성 점수 District Health Score" color="text-teal-400" />
      </div>

      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-sm text-gray-500 mb-3">
          광역시도와 동일한 4지표 산출: 재정자립도(30) + 재정자주도(25) + 채무비율(25) + 1인당채무(20)
        </div>
        {(() => {
          const filtered = globalMetro === '전체'
            ? allDistricts
            : allDistricts.filter((d) => d.metro === globalMetro);
          const scored = filtered
            .map((d) => ({ district: d, score: calculateDistrictHealthScore(d) }))
            .sort((a, b) => b.score.total - a.score.total);
          const gradeStats = { A: 0, B: 0, C: 0, D: 0, F: 0 };
          scored.forEach(({ score }) => { gradeStats[score.grade]++; });
          const avgTotal = scored.length > 0
            ? Math.round(scored.reduce((sum, s) => sum + s.score.total, 0) / scored.length)
            : 0;
          return (
            <>
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">평균</span>
                  <span className="text-lg font-mono font-bold text-teal-400">{avgTotal}점</span>
                </div>
                <div className="flex items-center gap-2">
                  {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
                    <span key={g} className={`text-xs font-mono px-1.5 py-0.5 rounded ${gradeBgColor(g)} text-gray-950 font-bold`}>
                      {g}: {gradeStats[g]}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">총 {scored.length}개 자치단체</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {scored.map(({ district: d, score }, idx) => (
                  <div key={`${d.metro}-${d.name}`} className="border border-gray-800 p-2.5 space-y-1.5 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-gray-600 font-mono w-5 text-right shrink-0">{idx + 1}</span>
                        <span className="text-sm font-bold text-gray-300 truncate">{d.name}</span>
                      </div>
                      <span className="text-base shrink-0">{gradeEmoji(score.grade)}</span>
                    </div>
                    {globalMetro === '전체' && (
                      <div className="text-xs text-gray-600 truncate pl-6">
                        {d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-mono font-bold ${gradeColor(score.grade)}`}>{score.total}</span>
                      <span className="text-xs text-gray-500">/ 100</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${gradeBgColor(score.grade)} text-gray-950`}>
                        {score.grade}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${gradeBgColor(score.grade)} transition-all`} style={{ width: `${score.total}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">자립</span>
                        <span className="font-mono text-gray-400">{score.breakdown.independence}/30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">자주</span>
                        <span className="font-mono text-gray-400">{score.breakdown.autonomy}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">채무율</span>
                        <span className="font-mono text-gray-400">{score.breakdown.debtRatio}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">인당</span>
                        <span className="font-mono text-gray-400">{score.breakdown.debtPerCapita}/20</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* 시군구 등급 범례 */}
      <div className="flex items-center justify-center gap-4 border border-gray-800 px-3 py-2 flex-wrap">
        {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
          <div key={g} className="flex items-center gap-1.5">
            <span className="text-base">{gradeEmoji(g)}</span>
            <span className={`text-sm font-bold ${gradeColor(g)}`}>{g}</span>
            <span className="text-xs text-gray-600">
              {g === 'A' ? '80+' : g === 'B' ? '65~79' : g === 'C' ? '50~64' : g === 'D' ? '35~49' : '~34'}
            </span>
          </div>
        ))}
      </div>

      {/* 시군구 다운로드 */}
      <div className="flex justify-end border border-gray-800 px-3 py-2">
        <DataDownload
          data={allDistricts.map((d) => {
            const s = calculateDistrictHealthScore(d);
            return {
              광역시도: d.metro,
              시군구: d.name,
              총점: s.total,
              등급: s.grade,
              '자립도점수': s.breakdown.independence,
              '자주도점수': s.breakdown.autonomy,
              '채무비율점수': s.breakdown.debtRatio,
              '1인당채무점수': s.breakdown.debtPerCapita,
            };
          })}
          filename="시군구_재정건전성점수_2025"
        />
      </div>
    </div>
  );
}
