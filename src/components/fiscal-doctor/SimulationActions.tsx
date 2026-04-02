'use client';

import { useState } from 'react';
import type { MultiPerspectiveResult } from './types';
import { downloadAsCSV, downloadAsJSON, downloadAsPDF } from './download-helpers';

interface SimulationActionsProps {
  simResult: MultiPerspectiveResult;
  regionName: string;
  policyText: string;
}

export function SimulationActions({ simResult, regionName, policyText }: SimulationActionsProps) {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [agentResults, setAgentResults] = useState<{
    agents: Array<{ id: string; name: string; role: string; emoji: string; stance: string; opinion: string; concern: string; suggestion: string }>;
    consensus: string;
    supportRate: number;
    keyDebatePoints: string[];
    source: string;
  } | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const dateStr = new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* Fallback notice */}
      {simResult.isFallback && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          <p className="text-amber-400 text-sm font-medium">규칙 기반 분석 결과</p>
          <p className="text-amber-400/80 text-xs mt-1">AI API 할당량 초과로 로컬 규칙 기반 분석 결과를 표시합니다. AI 분석은 잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {/* Download Buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => {
            const exportData = {
              지역: simResult.fiscal?.regionData?.name || regionName,
              정책: policyText,
              분석일시: dateStr,
              ...simResult.fiscal,
              주민관점: simResult.resident,
              정치관점: simResult.political,
              종합평가: simResult.synthesis,
            };
            downloadAsCSV(exportData as Record<string, unknown>, `정책시뮬레이션_${regionName}_${dateStr}.csv`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          CSV
        </button>
        <button
          onClick={() => {
            const exportData = {
              지역: simResult.fiscal?.regionData?.name || regionName,
              정책: policyText,
              분석일시: dateStr,
              fiscal: simResult.fiscal,
              resident: simResult.resident,
              political: simResult.political,
              synthesis: simResult.synthesis,
            };
            downloadAsJSON(exportData, `정책시뮬레이션_${regionName}_${dateStr}.json`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          JSON
        </button>
        <button
          onClick={() => {
            const exportData = {
              지역: simResult.fiscal?.regionData?.name || regionName,
              정책: policyText,
              분석일시: dateStr,
              ...simResult.fiscal,
              주민관점: simResult.resident,
              정치관점: simResult.political,
              종합평가: simResult.synthesis,
            };
            downloadAsPDF(exportData as Record<string, unknown>, `정책시뮬레이션_${regionName}_${dateStr}`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-600/30 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          PDF
        </button>
        <button
          onClick={async () => {
            setAiReportLoading(true);
            setAiReport(null);
            try {
              const res = await fetch('/api/chat/diagnosis/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regionName, policyText, simResult: simResult.fiscal }),
              });
              const data = await res.json();
              setAiReport(data.report || '보고서 생성 실패');
            } catch { setAiReport('보고서 생성 중 오류'); }
            finally { setAiReportLoading(false); }
          }}
          disabled={aiReportLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg border border-purple-600/30 transition-colors"
        >
          {aiReportLoading ? '생성 중...' : 'AI 보고서'}
        </button>
        <button
          onClick={async () => {
            setAgentLoading(true);
            setAgentResults(null);
            try {
              const res = await fetch('/api/chat/diagnosis/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regionName, policyText, regionData: simResult.fiscal?.regionData }),
              });
              const data = await res.json();
              setAgentResults(data);
            } catch { /* ignore */ }
            finally { setAgentLoading(false); }
          }}
          disabled={agentLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg border border-cyan-600/30 transition-colors"
        >
          {agentLoading ? '시뮬레이션 중...' : '에이전트 시뮬레이션'}
        </button>
      </div>

      {/* AI Report */}
      {aiReport && (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-4">
          <div className="text-sm font-semibold text-purple-400 mb-2">AI 서술형 보고서</div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{aiReport}</div>
        </div>
      )}

      {/* Multi-Agent Results */}
      {agentResults && (
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-cyan-400">멀티에이전트 시뮬레이션 (10명)</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">찬성률</div>
              <div className={`text-lg font-bold ${agentResults.supportRate >= 60 ? 'text-emerald-400' : agentResults.supportRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {agentResults.supportRate}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {agentResults.agents.map(agent => (
              <div key={agent.id} className={`rounded-lg p-3 border text-sm ${
                agent.stance === 'support' ? 'bg-emerald-900/20 border-emerald-500/30' :
                agent.stance === 'oppose' ? 'bg-red-900/20 border-red-500/30' :
                'bg-gray-800/50 border-gray-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{agent.emoji}</span>
                  <span className="font-semibold text-gray-200">{agent.name}</span>
                  <span className="text-xs text-gray-500">{agent.role}</span>
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                    agent.stance === 'support' ? 'bg-emerald-500/20 text-emerald-400' :
                    agent.stance === 'oppose' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {agent.stance === 'support' ? '찬성' : agent.stance === 'oppose' ? '반대' : '중립'}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">{agent.opinion}</p>
                {agent.concern && <p className="text-gray-500 text-xs mt-1">우려: {agent.concern}</p>}
              </div>
            ))}
          </div>

          {agentResults.keyDebatePoints.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-400 mb-1">핵심 쟁점</div>
              {agentResults.keyDebatePoints.map((point, i) => (
                <div key={i} className="text-xs text-gray-300">• {point}</div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-400 italic">{agentResults.consensus}</div>
          {agentResults.source === 'local' && (
            <div className="text-xs text-amber-500">규칙 기반 시뮬레이션 결과입니다.</div>
          )}
        </div>
      )}
    </>
  );
}
