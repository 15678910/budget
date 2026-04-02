'use client';

import type { MultiPerspectiveResult } from './types';
import { safeString } from './helpers';

interface StrategicAnalysisSectionProps {
  simResult: MultiPerspectiveResult;
}

export function StrategicAnalysisSection({ simResult }: StrategicAnalysisSectionProps) {
  return (
    <div className="space-y-4">
      {/* Deficit Analysis */}
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">적자 구조 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-red-400 font-medium">구조적 원인</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.deficitAnalysis.structuralCauses)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-orange-400 font-medium">운영적 원인</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.deficitAnalysis.operationalCauses)}</div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="text-xs text-amber-400 font-medium">연도별 적자 예측</div>
          <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.deficitAnalysis.deficitProjection)}</div>
        </div>
      </div>

      {/* Government Support */}
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">중앙정부 지원 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-blue-400 font-medium">건설비 지원</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.governmentSupport.constructionSupport)}</div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-blue-400 font-medium">운영비 지원</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.governmentSupport.operatingSupport)}</div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="text-xs text-cyan-400 font-medium">활용 가능 보조금/지원사업</div>
          <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.governmentSupport.subsidyPrograms)}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 space-y-1">
          <div className="text-xs text-amber-400 font-medium">지자체 실질 부담</div>
          <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.governmentSupport.localBurden)}</div>
        </div>
      </div>

      {/* Self-Sustainability */}
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">자립 경영 전략</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-emerald-400 font-medium">수익 창출 전략</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.selfSustainability.revenueStrategy)}</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-emerald-400 font-medium">비용 최적화</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.selfSustainability.costOptimization)}</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-emerald-400 font-medium">민관협력 모델</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.selfSustainability.partnershipModel)}</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-emerald-400 font-medium">단계별 경영 목표</div>
            <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.strategicAnalysis.selfSustainability.managementGoals)}</div>
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {simResult.fiscal.strategicAnalysis.alternatives && simResult.fiscal.strategicAnalysis.alternatives.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">
            대안 정책 비교
            <span className="ml-2 text-xs text-gray-500 font-normal">원안 대비 비용·효과 분석</span>
          </h3>
          <div className="space-y-3">
            {simResult.fiscal.strategicAnalysis.alternatives.map((alt, i) => (
              <div key={i} className="bg-purple-500/5 border border-purple-500/15 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">대안 {i + 1}</span>
                  <h4 className="text-sm font-semibold text-purple-300">{safeString(alt.title)}</h4>
                </div>
                <p className="text-sm text-gray-400">{safeString(alt.description)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="text-xs">
                    <span className="text-gray-500">비용 비교: </span>
                    <span className="text-amber-400">{safeString(alt.costComparison)}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">효과성: </span>
                    <span className="text-blue-400">{safeString(alt.effectiveness)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
