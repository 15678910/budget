'use client';

import { useMemo, useState } from 'react';
import { METRO_EDUCATION_BUDGETS } from '@/lib/data/education-budget';
import { analyzeCandidate, type RegionData } from '@/lib/pledge/analyze';
import type { PledgeDataset, Candidate } from '@/lib/pledge/types';

// 시도(정식명) → 추계 입력 (교육 공약 → 시도교육청 예산·학생수 기준)
function regionFor(sido: string): RegionData {
  const m = METRO_EDUCATION_BUDGETS.find((x) => x.metro === sido);
  return { population: m?.students ?? 200_000, budget: Math.round((m?.budget2026 ?? 3) * 10_000), independence: 40 };
}

const CAT_KR: Record<string, string> = {
  hospital: '의료', infrastructure: '인프라', education: '교육', housing: '주거', bank: '금융',
  digitalCurrency: '지역화폐', ai: 'AI·디지털', welfare: '복지', environment: '환경',
  tourism: '관광', culture: '문화', general: '일반',
};
const CAT_COLOR: Record<string, string> = {
  education: '#3b82f6', welfare: '#10b981', ai: '#8b5cf6', infrastructure: '#f59e0b',
  environment: '#22c55e', culture: '#ec4899', hospital: '#ef4444', housing: '#06b6d4',
  general: '#6b7280', bank: '#eab308', digitalCurrency: '#14b8a6', tourism: '#f97316',
};
const won = (eok: number) => (eok >= 10000 ? `${(eok / 10000).toFixed(1)}조` : `${Math.round(eok).toLocaleString()}억`);

export function EducationPledgeDashboard({ dataset }: { dataset: PledgeDataset }) {
  const sidos = useMemo(() => [...new Set(dataset.candidates.map((c) => c.sido))].sort((a, b) => a.localeCompare(b, 'ko')), [dataset]);
  const [sido, setSido] = useState(sidos[0] ?? '');
  const [openId, setOpenId] = useState<string | null>(null);

  const region = regionFor(sido);
  const cands = useMemo(() => dataset.candidates.filter((c) => c.sido === sido), [dataset, sido]);

  // 후보별 분석 (전 후보 동일 기준)
  const analyzed = useMemo(() => cands.map((c) => ({ c, a: analyzeCandidate(c.pledges, region) })), [cands, region]);
  const maxCost = Math.max(1, ...analyzed.map((x) => x.a.totalFiveYear));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">교육감 후보 공약 분석 (2026 지방선거)</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          전국 <strong className="text-gray-200">{dataset.candidates.length}명</strong> 교육감 후보의 5대 공약을
          <strong className="text-gray-200"> 동일 기준</strong>으로 분석합니다 — 정책 분야 분류 + 비용 추계.
          <span className="text-gray-500"> (출처: 중앙선관위 선거공약정보 · 비용추계: NABO 표준단가 엔진)</span>
        </p>
      </div>

      {/* 중립·추정 고지 */}
      <div className="border border-amber-900/40 bg-amber-950/20 rounded-lg p-3 text-[13px] text-amber-100/90 leading-relaxed">
        ⚖️ <strong className="text-amber-300">중립·추정 고지</strong> — 전 후보를 동일 방법론으로 분석합니다(특정 후보 우열 판단 아님).
        비용은 공약 텍스트를 표준단가에 적용한 <strong>개략 추정치(가정 기반)</strong>이며, 공약의 구체성에 따라 오차가 있습니다.
        효용(정책 효과)은 단정하지 않습니다. 원문·분류·추계는 참고용입니다.
      </div>

      {/* 시도 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400">시도</span>
        <select value={sido} onChange={(e) => { setSido(e.target.value); setOpenId(null); }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2">
          {sidos.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-500">후보 {cands.length}명 · 교육청 예산 {won(region.budget)} · 학생 {(region.population / 10000).toFixed(0)}만</span>
      </div>

      {/* 후보 비교 (5년 추정비용) */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">후보별 공약 5년 추정비용 비교</h3>
        <div className="space-y-2">
          {analyzed.map(({ c, a }) => (
            <div key={c.cnddtId} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-200 truncate shrink-0">{c.name}</span>
              <div className="flex-1 bg-gray-800 rounded h-5 overflow-hidden">
                <div className="h-full bg-blue-600 flex items-center justify-end px-2"
                  style={{ width: `${Math.max(6, (a.totalFiveYear / maxCost) * 100)}%` }}>
                  <span className="text-[11px] text-white whitespace-nowrap">{won(a.totalFiveYear)}</span>
                </div>
              </div>
              <span className="text-[11px] text-gray-500 w-24 text-right shrink-0">재정부담 {a.fiscalLoad}%</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 mt-2">※ 5년 추정비용 = 초기비용 + 연운영비×5 (추정). 재정부담 = 연운영비합 ÷ 시도교육청 예산.</p>
      </section>

      {/* 후보별 공약 상세 */}
      <div className="space-y-3">
        {analyzed.map(({ c, a }) => (
          <CandidateCard key={c.cnddtId} c={c} a={a} open={openId === c.cnddtId}
            onToggle={() => setOpenId(openId === c.cnddtId ? null : c.cnddtId)} />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ c, a, open, onToggle }: {
  c: Candidate;
  a: ReturnType<typeof analyzeCandidate>;
  open: boolean; onToggle: () => void;
}) {
  // 카테고리 분포
  const catCount: Record<string, number> = {};
  a.perPledge.forEach((p) => p.analysis.categories.forEach((cat) => { catCount[cat] = (catCount[cat] ?? 0) + 1; }));

  return (
    <div className="border border-gray-800 bg-gray-900/30 rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 text-left">
        <span className="text-base font-semibold text-gray-100">{c.name}</span>
        <span className="text-xs text-gray-500">{c.party}</span>
        <div className="flex gap-1 flex-wrap flex-1">
          {Object.entries(catCount).map(([cat, n]) => (
            <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ background: CAT_COLOR[cat] ?? '#6b7280' }}>{CAT_KR[cat] ?? cat}{n > 1 ? `×${n}` : ''}</span>
          ))}
        </div>
        <span className="text-xs text-gray-400 shrink-0">5년 {won(a.totalFiveYear)}</span>
        <span className="text-gray-500 shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800">
          {a.perPledge.map(({ pledge, analysis }, i) => (
            <div key={i} className="pt-3">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-sm font-semibold text-blue-300">공약 {pledge.ord}</span>
                <span className="text-sm text-gray-100 flex-1">{pledge.title}</span>
                <div className="flex gap-1">
                  {analysis.categories.map((cat) => (
                    <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: CAT_COLOR[cat] ?? '#6b7280' }}>{CAT_KR[cat] ?? cat}</span>
                  ))}
                </div>
                <span className="text-xs text-emerald-400 shrink-0">추정 {won(analysis.cost.initialCost)} <span className="text-gray-500">+운영 {won(analysis.cost.annualOperatingCost)}/년</span></span>
              </div>
              <p className="text-xs text-gray-400 mt-1 whitespace-pre-line line-clamp-4">{pledge.content.slice(0, 300)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
