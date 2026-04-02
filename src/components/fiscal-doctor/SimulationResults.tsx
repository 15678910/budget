'use client';

import type { MultiPerspectiveResult, DiagnosisResult } from './types';
import { safeString, formatDebtChange, formatIndependenceChange } from './helpers';
import { MultiPerspectiveAnalysis } from './MultiPerspectiveAnalysis';
import { StrategicAnalysisSection } from './StrategicAnalysisSection';
import { LocationAnalysisSection } from './LocationAnalysisSection';

interface SimulationResultsProps {
  simResult: MultiPerspectiveResult;
  diagnosis: DiagnosisResult;
}

export function SimulationResults({ simResult, diagnosis }: SimulationResultsProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* Summary + Feasibility + Timeframe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-gray-800/50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">정책 요약</div>
          <div className="text-sm text-gray-200">{safeString(simResult.fiscal.summary)}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">실현 가능성</div>
            <div className={`text-lg font-bold ${
              simResult.fiscal.feasibility === '상' ? 'text-emerald-400' :
              simResult.fiscal.feasibility === '중' ? 'text-amber-400' : 'text-red-400'
            }`}>{safeString(simResult.fiscal.feasibility)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500">효과 발현</div>
            <div className="text-sm font-semibold text-gray-200">{safeString(simResult.fiscal.timeframe)}</div>
          </div>
        </div>
      </div>

      {/* Fiscal Impact */}
      <FiscalImpactSection simResult={simResult} />

      {/* Cost Breakdown Table */}
      {simResult.fiscal.costBreakdown && <CostBreakdownSection simResult={simResult} />}

      {/* Scale Analysis */}
      {simResult.fiscal.scaleAnalysis && <ScaleAnalysisSection simResult={simResult} />}

      {/* Social Impact */}
      {simResult.fiscal.socialImpact && <SocialImpactSection simResult={simResult} />}

      {/* Case Comparison */}
      {simResult.fiscal.caseComparison && <CaseComparisonSection simResult={simResult} />}

      {/* Strategic Analysis */}
      {simResult.fiscal.strategicAnalysis && <StrategicAnalysisSection simResult={simResult} />}

      {/* Location Analysis */}
      {simResult.fiscal.locationAnalysis && simResult.fiscal.locationAnalysis.recommendedLocations && simResult.fiscal.locationAnalysis.recommendedLocations.length > 0 && (
        <LocationAnalysisSection simResult={simResult} />
      )}

      {/* Pros and Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-emerald-400 mb-2">장점</h4>
          <ul className="space-y-1.5">
            {simResult.fiscal.pros.map((pro, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">+</span>{safeString(pro)}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2">리스크</h4>
          <ul className="space-y-1.5">
            {simResult.fiscal.cons.map((con, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-red-400 shrink-0">-</span>{safeString(con)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Similar Cases + AI Recommendation */}
      <div className="space-y-3">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">국내외 유사 사례 및 출처</div>
          <div className="text-sm text-gray-300 leading-relaxed space-y-1">
            {safeString(simResult.fiscal.similarCases).split('\n').map((line, idx) => {
              const urlMatch = line.match(/\[(https?:\/\/[^\]]+)\]/);
              const textPart = line.replace(/\[https?:\/\/[^\]]+\]/, '').trim();
              return textPart ? (
                <div key={idx} className="flex items-start gap-1">
                  <span>{textPart}</span>
                  {urlMatch && (
                    <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap">↗출처</a>
                  )}
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-blue-400">AI 종합 평가</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-bold ${
                diagnosis.grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                diagnosis.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                diagnosis.grade === 'C' ? 'bg-amber-500/20 text-amber-400' :
                diagnosis.grade === 'D' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
              }`}>{diagnosis.grade}등급</span>
              <span className="text-gray-500">&rarr;</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                simResult.fiscal.projectedGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                simResult.fiscal.projectedGrade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                simResult.fiscal.projectedGrade === 'C' ? 'bg-amber-500/20 text-amber-400' :
                simResult.fiscal.projectedGrade === 'D' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
              }`}>{simResult.fiscal.projectedGrade}등급 예상</span>
            </div>
          </div>
          <div className="text-sm text-gray-200 leading-relaxed">{safeString(simResult.fiscal.recommendation)}</div>
        </div>
      </div>

      {/* Multi-Perspective Analysis */}
      {simResult.resident && <MultiPerspectiveAnalysis simResult={simResult} />}
    </div>
  );
}

// ─── Sub-sections ───

function FiscalImpactSection({ simResult }: { simResult: MultiPerspectiveResult }) {
  return (
    <div id="fiscal-impact" className="bg-gray-800/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">재정 영향 분석</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">순 재정효과</div>
          <div className={`text-base font-bold ${
            safeString(simResult.fiscal.fiscalImpact.netEffect).includes('+') ? 'text-emerald-400' : 'text-red-400'
          }`}>{safeString(simResult.fiscal.fiscalImpact.netEffect)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">재정자립도 변화</div>
          <div className={`text-base font-bold ${
            Number(simResult.fiscal.fiscalImpact.independenceChange) >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatIndependenceChange(simResult.fiscal.fiscalImpact.independenceChange)}%p
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">채무 변화</div>
          <div className={`text-base font-bold ${
            Number(simResult.fiscal.fiscalImpact.debtChange) <= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatDebtChange(simResult.fiscal.fiscalImpact.debtChange)}억원
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="text-sm text-gray-400"><span className="text-gray-500 text-xs block mb-0.5">세수 영향</span>{safeString(simResult.fiscal.fiscalImpact.revenue)}</div>
        <div className="text-sm text-gray-400"><span className="text-gray-500 text-xs block mb-0.5">지출 영향</span>{safeString(simResult.fiscal.fiscalImpact.expenditure)}</div>
      </div>
    </div>
  );
}

function CostBreakdownSection({ simResult }: { simResult: MultiPerspectiveResult }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">상세 비용 분석</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">항목</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">금액</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">산출 근거</th>
            </tr>
          </thead>
          <tbody>
            {simResult.fiscal.costBreakdown.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="py-2 px-3 text-gray-300">{safeString(item.category)}</td>
                <td className="py-2 px-3 text-right text-amber-400 font-medium whitespace-nowrap">{safeString(item.amount)}</td>
                <td className="py-2 px-3 text-gray-500 text-xs">{safeString(item.note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-2 border-t border-gray-700">
        <div>
          <span className="text-xs text-gray-500">초기 투자 총액: </span>
          <span className="text-sm font-bold text-amber-400">{safeString(simResult.fiscal.costBreakdown.totalInitialCost)}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500">연간 운영비: </span>
          <span className="text-sm font-bold text-amber-400">{safeString(simResult.fiscal.costBreakdown.annualOperatingCost)}</span>
        </div>
      </div>
    </div>
  );
}

function ScaleAnalysisSection({ simResult }: { simResult: MultiPerspectiveResult }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">규모 분석</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">추천 규모</div>
          <div className="text-sm font-semibold text-blue-400">{safeString(simResult.fiscal.scaleAnalysis.recommendedScale)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">단위 건설비</div>
          <div className="text-sm font-semibold text-gray-200">{safeString(simResult.fiscal.scaleAnalysis.constructionCostPerUnit)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">필요 인력</div>
          <div className="text-sm font-semibold text-gray-200">{safeString(simResult.fiscal.scaleAnalysis.staffingRequirement)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">손익분기</div>
          <div className="text-sm font-semibold text-gray-200">{safeString(simResult.fiscal.scaleAnalysis.breakEvenPoint)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">연간 수용량</div>
          <div className="text-sm font-semibold text-gray-200">{safeString(simResult.fiscal.scaleAnalysis.annualPatientCapacity)}</div>
        </div>
      </div>
    </div>
  );
}

function SocialImpactSection({ simResult }: { simResult: MultiPerspectiveResult }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">사회적 영향 분석</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">👥</span>
            <span className="text-xs text-gray-500">인구 영향</span>
          </div>
          <div className="text-sm text-gray-300">{safeString(simResult.fiscal.socialImpact.populationEffect)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🔄</span>
            <span className="text-xs text-gray-500">이주율 변화</span>
          </div>
          <div className="text-sm text-gray-300">{safeString(simResult.fiscal.socialImpact.migrationRate)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🏥</span>
            <span className="text-xs text-gray-500">서비스 접근성</span>
          </div>
          <div className="text-sm text-gray-300">{safeString(simResult.fiscal.socialImpact.serviceAccessibility)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <span className="text-xs text-gray-500">삶의 질</span>
          </div>
          <div className="text-sm text-gray-300">{safeString(simResult.fiscal.socialImpact.qualityOfLife)}</div>
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">💼</span>
          <span className="text-xs text-gray-500">고용 효과</span>
        </div>
        <div className="text-sm text-gray-300">{safeString(simResult.fiscal.socialImpact.employmentEffect)}</div>
      </div>
    </div>
  );
}

function CaseComparisonSection({ simResult }: { simResult: MultiPerspectiveResult }) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">실제 사례 비교</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">성공 사례</span>
            <span className="text-xs text-gray-500">{safeString(simResult.fiscal.caseComparison.bestCase.region)}</span>
          </div>
          <h4 className="text-sm font-semibold text-emerald-300">{safeString(simResult.fiscal.caseComparison.bestCase.name)}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{safeString(simResult.fiscal.caseComparison.bestCase.description)}</p>
          <div className="text-xs text-emerald-400/80 bg-emerald-500/10 rounded px-2 py-1">
            {safeString(simResult.fiscal.caseComparison.bestCase.keyMetrics)}
          </div>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">부진 사례</span>
            <span className="text-xs text-gray-500">{safeString(simResult.fiscal.caseComparison.worstCase.region)}</span>
          </div>
          <h4 className="text-sm font-semibold text-red-300">{safeString(simResult.fiscal.caseComparison.worstCase.name)}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{safeString(simResult.fiscal.caseComparison.worstCase.description)}</p>
          <div className="text-xs text-red-400/80 bg-red-500/10 rounded px-2 py-1">
            {safeString(simResult.fiscal.caseComparison.worstCase.keyMetrics)}
          </div>
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="text-xs text-amber-400 mb-1">핵심 교훈</div>
        <div className="text-sm text-gray-300">{safeString(simResult.fiscal.caseComparison.lesson)}</div>
      </div>
    </div>
  );
}


