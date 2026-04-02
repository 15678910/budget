'use client';

import type { MultiPerspectiveResult } from './types';
import { safeString } from './helpers';

interface MultiPerspectiveAnalysisProps {
  simResult: MultiPerspectiveResult;
}

export function MultiPerspectiveAnalysis({ simResult }: MultiPerspectiveAnalysisProps) {
  return (
    <div id="multi-perspective" className="border-t border-gray-700 pt-6 mt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-semibold text-gray-200">다관점 분석</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">MiroFish-style</span>
      </div>

      {/* Resident Perspective */}
      <div className="bg-gray-800/30 rounded-lg p-4 space-y-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">1</span>
            주민 관점 분석
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              simResult.resident.overallSentiment === '긍정' ? 'bg-emerald-500/20 text-emerald-400' :
              simResult.resident.overallSentiment === '부정' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              여론: {simResult.resident.overallSentiment}
            </span>
            <span className={`text-xs font-bold ${
              simResult.resident.sentimentScore > 0 ? 'text-emerald-400' :
              simResult.resident.sentimentScore < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {simResult.resident.sentimentScore > 0 ? '+' : ''}{simResult.resident.sentimentScore}점
            </span>
          </div>
        </div>

        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 h-full rounded-full transition-all ${
              simResult.resident.sentimentScore > 0 ? 'bg-emerald-500 left-1/2' :
              'bg-red-500 right-1/2'
            }`}
            style={{ width: `${Math.abs(simResult.resident.sentimentScore) / 2}%` }}
          />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-cyan-400 font-medium">삶의 질 변화</div>
            <div className="text-sm text-gray-300">{safeString(simResult.resident.qualityOfLifeChange)}</div>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-1">
            <div className="text-xs text-cyan-400 font-medium">인구통계 영향</div>
            <div className="text-sm text-gray-300">{safeString(simResult.resident.demographicImpact)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
            <div className="text-xs text-emerald-400 font-medium mb-2">주민 혜택</div>
            <ul className="space-y-1">
              {simResult.resident.benefits.map((b: string, i: number) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-emerald-400 shrink-0">+</span>{safeString(b)}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
            <div className="text-xs text-red-400 font-medium mb-2">주민 우려</div>
            <ul className="space-y-1">
              {simResult.resident.concerns.map((c: string, i: number) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-red-400 shrink-0">!</span>{safeString(c)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-gray-500">여론 전망</div>
            <div className="text-xs text-gray-300">{safeString(simResult.resident.publicOpinionForecast)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-gray-500">취약계층 영향</div>
            <div className="text-xs text-gray-300">{safeString(simResult.resident.vulnerableGroups)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-gray-500">일상생활 변화</div>
            <div className="text-xs text-gray-300">{safeString(simResult.resident.dailyLifeImpact)}</div>
          </div>
        </div>
      </div>

      {/* Political Perspective */}
      {simResult.political && (
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs">2</span>
              정치 관점 분석
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              simResult.political.feasibility === '높음' ? 'bg-emerald-500/20 text-emerald-400' :
              simResult.political.feasibility === '낮음' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              실현가능성: {simResult.political.feasibility}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
              <div className="text-xs text-emerald-400 font-medium mb-2">지지 세력</div>
              <div className="space-y-2">
                {simResult.political.supportingActors.map((actor: { name: string; reason: string }, i: number) => (
                  <div key={i} className="text-xs">
                    <span className="text-emerald-300 font-medium">{safeString(actor.name)}</span>
                    <p className="text-gray-400 mt-0.5">{safeString(actor.reason)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
              <div className="text-xs text-red-400 font-medium mb-2">반대 세력</div>
              <div className="space-y-2">
                {simResult.political.opposingActors.map((actor: { name: string; reason: string }, i: number) => (
                  <div key={i} className="text-xs">
                    <span className="text-red-300 font-medium">{safeString(actor.name)}</span>
                    <p className="text-gray-400 mt-0.5">{safeString(actor.reason)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3 space-y-1">
              <div className="text-xs text-orange-400 font-medium">입법/조례 과정</div>
              <div className="text-sm text-gray-300">{safeString(simResult.political.legislativeProcess)}</div>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3 space-y-1">
              <div className="text-xs text-orange-400 font-medium">정치적 타임라인</div>
              <div className="text-sm text-gray-300">{safeString(simResult.political.politicalTimeline)}</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div className="text-xs text-gray-500 font-medium">정치적 리스크</div>
            <div className="flex flex-wrap gap-2">
              {simResult.political.riskFactors.map((risk: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-red-500/10 text-red-300 rounded-full border border-red-500/20">
                  {safeString(risk)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">중앙-지방 관계</div>
              <div className="text-xs text-gray-300">{safeString(simResult.political.intergovernmentalIssues)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
              <div className="text-xs text-gray-500">선거 영향</div>
              <div className="text-xs text-gray-300">{safeString(simResult.political.electionImpact)}</div>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 space-y-1">
            <div className="text-xs text-orange-400 font-medium">정치적 추진 전략</div>
            <div className="text-sm text-gray-200">{safeString(simResult.political.recommendation)}</div>
          </div>
        </div>
      )}

      {/* Synthesis */}
      {simResult.synthesis && (
        <div className="bg-purple-500/5 border border-purple-500/30 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-purple-300">3-관점 종합 평가</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Synthesis</span>
          </div>
          <div className="text-sm text-gray-200 leading-relaxed">{safeString(simResult.synthesis)}</div>
        </div>
      )}
    </div>
  );
}
