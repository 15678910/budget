'use client';

import type { MultiPerspectiveResult } from './types';
import { safeString } from './helpers';

interface LocationAnalysisSectionProps {
  simResult: MultiPerspectiveResult;
}

export function LocationAnalysisSection({ simResult }: LocationAnalysisSectionProps) {
  const locationAnalysis = simResult.fiscal.locationAnalysis!;
  return (
    <div className="space-y-4">
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-300">최적 입지 분석</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">AI 위치 추천</span>
        </div>

        {locationAnalysis.selectionCriteria && (
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-indigo-400 font-medium">입지 선정 기준</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(locationAnalysis.selectionCriteria)}</div>
          </div>
        )}

        <div className="space-y-3">
          {locationAnalysis.recommendedLocations.map((loc, i) => (
            <div key={i} className={`rounded-lg p-4 space-y-3 border ${
              i === 0 ? 'bg-indigo-500/5 border-indigo-500/30' :
              i === 1 ? 'bg-blue-500/5 border-blue-500/20' :
              'bg-gray-800/50 border-gray-700/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-indigo-500/30 text-indigo-300' :
                    i === 1 ? 'bg-blue-500/30 text-blue-300' :
                    'bg-gray-700 text-gray-400'
                  }`}>{loc.rank || i + 1}</span>
                  <h4 className={`text-sm font-bold ${
                    i === 0 ? 'text-indigo-300' : i === 1 ? 'text-blue-300' : 'text-gray-300'
                  }`}>{loc.name}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">종합점수</span>
                  <span className={`font-bold ${
                    Number(loc.score) >= 80 ? 'text-emerald-400' :
                    Number(loc.score) >= 60 ? 'text-blue-400' :
                    'text-amber-400'
                  }`}>{loc.score}/100</span>
                </div>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">{safeString(loc.reasoning)}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-900/50 rounded px-2 py-1.5">
                  <span className="text-gray-500 block">인구</span>
                  <span className="text-gray-300 font-medium">{typeof loc.population === 'number' ? loc.population.toLocaleString() + '명' : loc.population}</span>
                </div>
                <div className="bg-gray-900/50 rounded px-2 py-1.5">
                  <span className="text-gray-500 block">최근접 시설</span>
                  <span className="text-gray-300 font-medium">{safeString(loc.distanceToNearest)}</span>
                </div>
                <div className="bg-gray-900/50 rounded px-2 py-1.5">
                  <span className="text-gray-500 block">토지비용</span>
                  <span className="text-gray-300 font-medium">{safeString(loc.landCostEstimate)}</span>
                </div>
                <div className="bg-gray-900/50 rounded px-2 py-1.5">
                  <span className="text-gray-500 block">종합점수</span>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${
                      Number(loc.score) >= 80 ? 'bg-emerald-500' :
                      Number(loc.score) >= 60 ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`} style={{ width: `${Number(loc.score) || 50}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-emerald-400 font-medium">강점</div>
                  <ul className="space-y-0.5">
                    {loc.strengths.map((s, j) => (
                      <li key={j} className="text-xs text-gray-400 flex gap-1.5">
                        <span className="text-emerald-400 shrink-0">+</span>{safeString(s)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-orange-400 font-medium">도전과제</div>
                  <ul className="space-y-0.5">
                    {loc.challenges.map((c, j) => (
                      <li key={j} className="text-xs text-gray-400 flex gap-1.5">
                        <span className="text-orange-400 shrink-0">!</span>{safeString(c)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {locationAnalysis.medicalDesertAreas && (
          <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-red-400 font-medium">의료 취약 지역 분석</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(locationAnalysis.medicalDesertAreas)}</div>
          </div>
        )}

        {locationAnalysis.accessibilityNote && (
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-cyan-400 font-medium">교통 접근성 분석</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(locationAnalysis.accessibilityNote)}</div>
          </div>
        )}

        {locationAnalysis.overallRecommendation && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 space-y-1">
            <div className="text-xs text-indigo-400 font-medium">최종 입지 추천</div>
            <div className="text-sm text-gray-200 leading-relaxed font-medium">{safeString(locationAnalysis.overallRecommendation)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
