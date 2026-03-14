'use client';

import { useMemo } from 'react';
import {
  SDG_GOALS,
  calculateSDGImpactScore,
  getSDGImpactDescription,
  calculatePovertyEscapeHouseholds,
  calculateGiniImprovement,
  calculateEducationBurdenRelief,
} from '@/lib/data/ai-activities-data';

interface SDGImpactDashboardProps {
  monthlyBasicIncome: number; // 만원/월
  annualSavings: number; // 조원
  years: number; // 운용 기간
}

export function SDGImpactDashboard({
  monthlyBasicIncome,
  annualSavings,
  years,
}: SDGImpactDashboardProps) {
  const impactData = useMemo(() => {
    const relevantSDGs = [1, 10, 4, 16, 3, 8, 9];
    return relevantSDGs
      .map((num) => {
        const sdg = SDG_GOALS.find((g) => g.number === num);
        const score = calculateSDGImpactScore(num, monthlyBasicIncome);
        const description = getSDGImpactDescription(num, monthlyBasicIncome);
        return {
          number: num,
          name: sdg?.name ?? `SDG ${num}`,
          color: sdg?.color ?? '#6b7280',
          score,
          description,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [monthlyBasicIncome]);

  const summaryStats = useMemo(
    () => ({
      povertyEscape: calculatePovertyEscapeHouseholds(monthlyBasicIncome),
      giniImprovement: calculateGiniImprovement(monthlyBasicIncome),
      educationRelief: calculateEducationBurdenRelief(monthlyBasicIncome),
    }),
    [monthlyBasicIncome],
  );

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-base font-bold text-gray-200">
          AI 기본소득 × SDG 영향 분석{' '}
          <span className="text-gray-600 text-sm font-normal">
            SDG IMPACT ANALYSIS
          </span>
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          월 {Math.round(monthlyBasicIncome)}만원 기본소득이 UN
          지속가능발전목표에 미치는 영향
        </p>
      </div>

      {/* SDG Impact Bars */}
      <div className="p-4 space-y-3">
        {impactData.map((sdg) => (
          <div key={sdg.number} className="space-y-1">
            <div className="flex items-center gap-3">
              {/* SDG Number Badge */}
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: sdg.color }}
              >
                {sdg.number}
              </span>
              {/* Name + Score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-300">
                    {sdg.name}
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: sdg.color }}
                  >
                    {sdg.score}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sdg.score}%`,
                      backgroundColor: sdg.color,
                    }}
                  />
                </div>
                {/* Description */}
                <p className="text-xs text-gray-500 mt-0.5">
                  {sdg.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-3">
          {/* Poverty Escape */}
          <div className="border border-gray-800 rounded p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">
              기초생활수급 탈출
            </div>
            <div className="text-lg font-mono font-bold text-red-400">
              {summaryStats.povertyEscape > 0
                ? `약 ${summaryStats.povertyEscape}만`
                : '--'}
            </div>
            <div className="text-[10px] text-gray-600">가구</div>
          </div>
          {/* Gini Improvement */}
          <div className="border border-gray-800 rounded p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">지니계수 개선</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {summaryStats.giniImprovement > 0
                ? `-${summaryStats.giniImprovement.toFixed(3)}`
                : '--'}
            </div>
            <div className="text-[10px] text-gray-600">포인트</div>
          </div>
          {/* Education Relief */}
          <div className="border border-gray-800 rounded p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">교육비 부담 경감</div>
            <div className="text-lg font-mono font-bold text-blue-400">
              {summaryStats.educationRelief > 0
                ? `연 ${summaryStats.educationRelief.toLocaleString()}만`
                : '--'}
            </div>
            <div className="text-[10px] text-gray-600">원/인</div>
          </div>
        </div>
      </div>

      {/* Contextual Message */}
      {monthlyBasicIncome > 0 && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/30">
          <p className="text-sm text-gray-400">
            월{' '}
            <span className="text-cyan-400 font-bold">
              {Math.round(monthlyBasicIncome)}만원
            </span>
            의 기본소득은{' '}
            <span
              className="font-bold"
              style={{ color: impactData[0]?.color }}
            >
              SDG {impactData[0]?.number}({impactData[0]?.name})
            </span>
            {impactData[1] && (
              <>
                ,{' '}
                <span
                  className="font-bold"
                  style={{ color: impactData[1]?.color }}
                >
                  SDG {impactData[1]?.number}({impactData[1]?.name})
                </span>
              </>
            )}
            에 가장 큰 영향을 미칩니다. {years}년간 연{' '}
            {annualSavings.toFixed(1)}조원의 공공부문 효율화가 이를
            뒷받침합니다.
          </p>
        </div>
      )}
    </div>
  );
}
