'use client';

import { useMemo, useState } from 'react';
import { METRO_EDUCATION_BUDGETS } from '@/lib/data/education-budget';
import { analyzeCandidate, scoreFeasibility, type RegionData, type FeasibilityScore } from '@/lib/pledge/analyze';
import type { PledgeDataset, Candidate } from '@/lib/pledge/types';

export interface PledgeFeed { type: string; label: string; dataset: PledgeDataset }

// 추계 입력: 교육감=시도교육청 예산, 그 외=상대비교용 개략 기준(레이스 내 동일)
function regionFor(type: string, sido: string): RegionData {
  if (type === '11') {
    const m = METRO_EDUCATION_BUDGETS.find((x) => x.metro === sido);
    return { population: m?.students ?? 200_000, budget: Math.round((m?.budget2026 ?? 3) * 10_000), independence: 40 };
  }
  // 시도지사·구시군의장: 정밀 지자체예산 미연동 → 상대 비교용 개략 입력(동일 레이스 내 일정)
  return { population: type === '3' ? 1_500_000 : 250_000, budget: type === '3' ? 200_000 : 8_000, independence: 35 };
}

// 13개 정책 카테고리 (labor 포함)
const CAT_ORDER = [
  'education', 'welfare', 'infrastructure', 'housing', 'labor', 'environment',
  'culture', 'tourism', 'hospital', 'ai', 'bank', 'digitalCurrency', 'general',
] as const;
const CAT_KR: Record<string, string> = {
  hospital: '의료', infrastructure: '인프라', education: '교육', housing: '주거', bank: '금융',
  digitalCurrency: '지역화폐', ai: 'AI·디지털', welfare: '복지', environment: '환경',
  tourism: '관광', culture: '문화', labor: '노동·일자리', general: '일반',
};
// 매트릭스 헤더용 짧은 라벨
const CAT_KR_SHORT: Record<string, string> = {
  hospital: '의료', infrastructure: '인프라', education: '교육', housing: '주거', bank: '금융',
  digitalCurrency: '지역화폐', ai: 'AI', welfare: '복지', environment: '환경',
  tourism: '관광', culture: '문화', labor: '일자리', general: '일반',
};
const CAT_COLOR: Record<string, string> = {
  education: '#3b82f6', welfare: '#10b981', ai: '#8b5cf6', infrastructure: '#f59e0b',
  environment: '#22c55e', culture: '#ec4899', hospital: '#ef4444', housing: '#06b6d4',
  general: '#6b7280', bank: '#eab308', digitalCurrency: '#14b8a6', tourism: '#f97316',
  labor: '#a855f7',
};

const won = (eok: number) => (eok >= 10000 ? `${(eok / 10000).toFixed(1)}조` : `${Math.round(eok).toLocaleString()}억`);
const PARTY_DOT: Record<string, string> = {
  '더불어민주당': '#2563eb', '국민의힘': '#dc2626', '정의당': '#eab308',
  '개혁신당': '#f97316', '진보당': '#e11d48', '무소속': '#6b7280',
};

type Analyzed = { c: Candidate; a: ReturnType<typeof analyzeCandidate>; catCount: Record<string, number>; catCost: Record<string, number>; score: FeasibilityScore };

export function EducationPledgeDashboard({ feeds }: { feeds: PledgeFeed[] }) {
  const [type, setType] = useState(feeds[0]?.type ?? '11');
  const feed = feeds.find((f) => f.type === type) ?? feeds[0];
  const cands = feed.dataset.candidates;

  // 레이스(선거구) = 구시군의장은 시군구(sgg), 그 외 시도
  const groupKey = (c: Candidate) => (type === '4' ? (c.sgg || c.sido) : c.sido);
  const groups = useMemo(() => [...new Set(cands.map(groupKey))].sort((a, b) => a.localeCompare(b, 'ko')), [cands, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const [group, setGroup] = useState(groups[0] ?? '');
  const curGroup = groups.includes(group) ? group : (groups[0] ?? '');

  const raceCands = useMemo(() => cands.filter((c) => groupKey(c) === curGroup), [cands, curGroup, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const region = regionFor(type, raceCands[0]?.sido ?? curGroup);

  const analyzed: Analyzed[] = useMemo(() => raceCands.map((c) => {
    const a = analyzeCandidate(c.pledges, region);
    const catCount: Record<string, number> = {};
    const catCost: Record<string, number> = {};
    a.perPledge.forEach((p) => p.analysis.categories.forEach((cat) => {
      catCount[cat] = (catCount[cat] ?? 0) + 1;
      // 카테고리 공유 시 비용 균등 분배
      catCost[cat] = (catCost[cat] ?? 0) + p.analysis.fiveYearCost / p.analysis.categories.length;
    }));
    return { c, a, catCount, catCost, score: scoreFeasibility(a) };
  }), [raceCands, region]);

  const maxCost = Math.max(1, ...analyzed.map((x) => x.a.totalFiveYear));
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = analyzed.find((x) => x.c.cnddtId === openId) ?? null;

  // KPI 집계
  const kpi = useMemo(() => {
    const totalPledges = analyzed.reduce((s, x) => s + x.a.pledgeCount, 0);
    const avgFiveYear = analyzed.length ? analyzed.reduce((s, x) => s + x.a.totalFiveYear, 0) / analyzed.length : 0;
    const activeCats = new Set<string>();
    analyzed.forEach((x) => Object.keys(x.catCount).forEach((cat) => activeCats.add(cat)));
    return { candidates: analyzed.length, totalPledges, avgFiveYear, diversity: activeCats.size };
  }, [analyzed]);

  // 매트릭스에 표시할 활성 카테고리(레이스 내 1건 이상 등장)만 — 빈 열 제거
  const activeCols = useMemo(
    () => CAT_ORDER.filter((cat) => analyzed.some((x) => (x.catCount[cat] ?? 0) > 0)),
    [analyzed],
  );
  const maxCellCount = Math.max(1, ...analyzed.flatMap((x) => Object.values(x.catCount)));

  // 실현가능성 순위 (레이스 내, total 내림차순)
  const ranked = useMemo(
    () => [...analyzed].sort((a, b) => b.score.total - a.score.total),
    [analyzed],
  );

  return (
    <div className="space-y-6 text-gray-200">
      {/* ── 헤더 ── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">PLEDGE ANALYSIS · 2026 지방선거</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-50">선거 공약 분석 콘솔</h2>
        <p className="text-[15px] text-gray-400 leading-relaxed">
          후보 공약을 <strong className="text-gray-200">동일 기준</strong>으로 분류·추계합니다.
          <span className="text-gray-500"> 출처 중앙선관위 선거공약정보 · 추계 NABO 표준단가 엔진</span>
        </p>
      </div>

      {/* ── 직급 탭 ── */}
      <div className="flex gap-1 border-b border-gray-800 flex-wrap">
        {feeds.map((f) => (
          <button key={f.type} onClick={() => { setType(f.type); setOpenId(null); }}
            className={`px-4 py-2 text-[15px] font-medium border-b-2 -mb-px transition-colors ${type === f.type ? 'border-sky-400 text-sky-300 bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'}`}>
            {f.label} <span className="font-mono text-xs text-gray-500">{f.dataset.candidates.length}</span>
          </button>
        ))}
      </div>

      {/* ── 중립·추정 고지 ── */}
      <div className="border-l-2 border-amber-500/60 bg-amber-950/20 rounded-r-md py-3 px-4 text-sm text-amber-100/85 leading-relaxed">
        <strong className="text-amber-300">⚖ 중립·추정 고지</strong> — 전 후보를 동일 방법론으로 분석합니다(특정 후보 우열 판단 아님).
        비용은 공약 텍스트를 표준단가에 적용한 <strong>개략 추정치(가정 기반)</strong>이며, 같은 선거구 내 상대 비교용입니다.
        효용(정책 효과)은 단정하지 않습니다.{type !== '11' && <span className="text-amber-200/70"> ※ 시도지사·기초단체장은 지자체 정밀예산 미연동(상대 비교 기준).</span>}
      </div>

      {/* ── 선거구 선택 ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="font-mono text-xs uppercase tracking-wider text-gray-500">{type === '4' ? 'DISTRICT · 시군구' : 'REGION · 시도'}</label>
        <select value={curGroup} onChange={(e) => { setGroup(e.target.value); setOpenId(null); }}
          className="bg-gray-900 border border-gray-700 text-gray-100 text-[15px] rounded-md px-3 py-2 max-w-[280px] focus:border-sky-500 focus:outline-none">
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="font-mono text-xs text-gray-500">{groups.length}개 선거구</span>
      </div>

      {/* ── KPI 요약 행 ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-800 border border-gray-800 rounded-lg overflow-hidden">
        <Kpi label="후보 수" value={String(kpi.candidates)} unit="명" accent="text-sky-300" />
        <Kpi label="총 공약" value={String(kpi.totalPledges)} unit="건" accent="text-gray-100" />
        <Kpi label="평균 5년 추정비용" value={won(kpi.avgFiveYear)} unit="" accent="text-emerald-300" />
        <Kpi label="분야 다양성" value={`${kpi.diversity}`} unit="/13" accent="text-violet-300" />
      </section>

      {/* ── 후보 × 분야 온톨로지 매트릭스 (히트맵) ── */}
      <section className="border border-gray-800 bg-gray-900/40 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/60">
          <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <span className="font-mono text-xs text-sky-400">▣</span> 후보 × 정책분야 매트릭스
          </h3>
          <span className="font-mono text-xs text-gray-500">셀 농도 = 공약 수</span>
        </div>
        <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800/60 bg-gray-900/30">
          셀 숫자 = 해당 후보의 5대 공약 중 그 분야에 해당하는 <strong className="text-gray-400">공약 수</strong> (한 공약이 여러 분야에 중복 분류될 수 있어 합이 5를 넘을 수 있음). 색이 진할수록 집중. <span className="text-gray-600">※ 분야는 공약 텍스트 자동 분류(시스템 추정).</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="sticky left-0 z-10 bg-gray-900/90 backdrop-blur px-3 py-2 text-xs font-medium text-gray-400 min-w-[150px]">후보</th>
                {activeCols.map((cat) => (
                  <th key={cat} className="px-1 py-2 text-center min-w-[48px]">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <span className="h-1.5 w-1.5 rounded-sm" style={{ background: CAT_COLOR[cat] }} />
                      <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{CAT_KR_SHORT[cat]}</span>
                    </span>
                  </th>
                ))}
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-400 whitespace-nowrap">5년</th>
              </tr>
            </thead>
            <tbody>
              {analyzed.map(({ c, a, catCount }) => (
                <tr key={c.cnddtId} onClick={() => setOpenId(c.cnddtId)}
                  className={`border-b border-gray-800/60 cursor-pointer transition-colors hover:bg-sky-950/30 ${openId === c.cnddtId ? 'bg-sky-950/40' : ''}`}>
                  <td className="sticky left-0 z-10 bg-gray-900/90 backdrop-blur px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PARTY_DOT[c.party] ?? '#6b7280' }} />
                      <span className="text-[15px] font-medium text-gray-100 truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <span className="block text-xs text-gray-500 truncate pl-4">{c.party}</span>
                  </td>
                  {activeCols.map((cat) => {
                    const n = catCount[cat] ?? 0;
                    const intensity = n === 0 ? 0 : 0.18 + (n / maxCellCount) * 0.82;
                    return (
                      <td key={cat} className="px-1 py-2 text-center">
                        <div className="mx-auto h-8 w-10 rounded flex items-center justify-center font-mono text-sm"
                          style={{
                            background: n === 0 ? 'rgba(255,255,255,0.025)' : hexA(CAT_COLOR[cat], intensity),
                            color: n === 0 ? 'transparent' : intensity > 0.55 ? '#fff' : CAT_COLOR[cat],
                          }}>
                          {n || '·'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-right font-mono text-sm text-emerald-300 whitespace-nowrap">{won(a.totalFiveYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2.5 text-xs text-gray-600 border-t border-gray-800/60">행 클릭 시 우측 상세 패널 — 5년 추정비용 = 초기비용 + 연운영비×5 (추정·상대비교용).</p>
      </section>

      {/* ── 5년 추정비용 비교 막대 ── */}
      <section className="border border-gray-800 bg-gray-900/40 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900/60">
          <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <span className="font-mono text-xs text-emerald-400">≡</span> 후보별 5년 추정비용
          </h3>
        </div>
        <div className="p-4 space-y-2.5">
          {analyzed.map(({ c, a }) => (
            <div key={c.cnddtId} className="flex items-center gap-3 group cursor-pointer" onClick={() => setOpenId(c.cnddtId)}>
              <span className="w-28 text-[15px] text-gray-200 truncate shrink-0 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: PARTY_DOT[c.party] ?? '#6b7280' }} />
                {c.name}
              </span>
              <div className="flex-1 bg-gray-800/70 rounded h-7 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-sky-700 to-sky-500 flex items-center justify-end px-2 group-hover:from-sky-600 group-hover:to-sky-400 transition-colors"
                  style={{ width: `${Math.max(8, (a.totalFiveYear / maxCost) * 100)}%` }}>
                  <span className="font-mono text-xs text-white whitespace-nowrap">{won(a.totalFiveYear)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 재정·집행 실현가능성 지수 ── */}
      <section className="border border-gray-800 bg-gray-900/40 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/60">
          <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400">◈</span> 재정·집행 실현가능성 지수
          </h3>
          <p className="mt-1.5 font-mono text-xs text-gray-500 leading-relaxed">
            공식 — 재정실현성 40% + 집행실현성 40% + 공약구체성 20% (전 후보 동일·투명 산식)
          </p>
        </div>

        <div className="p-4 space-y-2.5">
          {ranked.map((x, i) => {
            const dot = PARTY_DOT[x.c.party] ?? '#6b7280';
            return (
              <div
                key={x.c.cnddtId}
                onClick={() => setOpenId(x.c.cnddtId)}
                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${openId === x.c.cnddtId ? 'border-indigo-500/50 bg-indigo-950/30' : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/40'}`}
              >
                {/* 순위 */}
                <span className={`w-7 shrink-0 text-center font-mono text-base font-bold ${i === 0 ? 'text-indigo-300' : 'text-gray-500'}`}>{i + 1}</span>
                {/* 후보 */}
                <div className="w-32 shrink-0 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dot }} />
                    <span className="text-[15px] font-medium text-gray-100 truncate">{x.c.name}</span>
                  </div>
                  <span className="block pl-3.5 text-xs text-gray-500 truncate">{x.c.party}</span>
                </div>
                {/* 세부 미니바 */}
                <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                  <ScoreBar label="재정" value={x.score.fiscal} color="#10b981" />
                  <ScoreBar label="집행" value={x.score.exec} color="#0ea5e9" />
                  <ScoreBar label="구체성" value={x.score.concrete} color="#a855f7" />
                </div>
                {/* 종합점수 */}
                <div className="w-16 shrink-0 text-right">
                  <span className="font-mono text-2xl font-bold tabular-nums text-indigo-300">{x.score.total}</span>
                  <span className="block text-xs text-gray-500 -mt-0.5">/ 100</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="px-4 py-3 text-xs text-amber-100/70 leading-relaxed border-t border-gray-800/60 bg-amber-950/10">
          ※ 실현가능성(비용·재정·집행) 지표이며, 공약의 가치·효과·교육 환경 &lsquo;질&rsquo;을 평가하지 않습니다. 효용은 단정하지 않습니다.
        </p>
      </section>

      {/* ── 상세 드로어 ── */}
      {opened && (
        <CandidateDrawer data={opened} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

function Kpi({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="bg-gray-900/60 px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl md:text-3xl font-semibold tabular-nums ${accent}`}>{value}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

function CandidateDrawer({ data, onClose }: { data: Analyzed; onClose: () => void }) {
  const { c, a } = data;
  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none" role="dialog" aria-modal="true">
      {/* 투명 클릭 캐처: 왼쪽 대시보드를 어둡게 하지 않고(딤 없음) 바깥 클릭 시 닫기만 */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
      <aside className="pointer-events-auto relative w-full max-w-md h-full bg-gray-950 border-l border-gray-700 shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.7)] overflow-y-auto">
        {/* 드로어 헤더 */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PARTY_DOT[c.party] ?? '#6b7280' }} />
                <h3 className="text-xl font-bold text-gray-50">{c.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 pl-4">{c.party}{c.sgg ? ` · ${c.sgg}` : c.sido ? ` · ${c.sido}` : ''}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none px-2 -mr-2" aria-label="닫기">✕</button>
          </div>
          {/* 드로어 미니 KPI */}
          <div className="grid grid-cols-3 gap-px bg-gray-800 border border-gray-800 rounded-md overflow-hidden mt-4">
            <MiniStat label="공약" value={String(a.pledgeCount)} />
            <MiniStat label="초기 추정" value={won(a.totalInitial)} />
            <MiniStat label="5년 추정" value={won(a.totalFiveYear)} accent="text-emerald-300" />
          </div>
        </div>

        {/* 출처·추정 구분 고지 */}
        <div className="px-5 pt-4">
          <div className="rounded-md border border-gray-700 bg-gray-900/60 px-4 py-3 text-[13px] leading-relaxed space-y-1.5">
            <p className="text-gray-200">
              <span className="font-semibold text-sky-300">📋 공약 원문</span>은 후보가 중앙선관위에 제출한 내용입니다.
            </p>
            <p className="text-gray-200">
              <span className="font-semibold text-emerald-300">💰 비용·산출근거</span>는 후보가 제시한 게 아니라
              <span className="text-amber-200"> 본 시스템이 NABO 표준단가로 추정한 값</span>입니다.
            </p>
          </div>
        </div>

        {/* 공약 리스트 */}
        <div className="px-5 py-4 space-y-5">
          <h4 className="font-mono text-xs uppercase tracking-wider text-gray-500">공약 상세 ({a.pledgeCount})</h4>
          {a.perPledge.map(({ pledge, analysis }, i) => (
            <article key={i} className="border border-gray-800 rounded-lg bg-gray-900/40 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-800/60">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs text-sky-400 shrink-0 mt-0.5">#{pledge.ord}</span>
                  <h5 className="text-base font-semibold text-gray-100 leading-snug flex-1">{pledge.title}</h5>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-6">
                  {analysis.categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
                      style={{ borderColor: hexA(CAT_COLOR[cat] ?? '#6b7280', 0.5), color: CAT_COLOR[cat] ?? '#9ca3af', background: hexA(CAT_COLOR[cat] ?? '#6b7280', 0.12) }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLOR[cat] ?? '#6b7280' }} />
                      {CAT_KR[cat] ?? cat}
                    </span>
                  ))}
                </div>
              </div>
              {/* ── 후보 작성 공약 원문 ── */}
              {pledge.content && (
                <div className="px-4 py-3 border-b border-gray-800/60">
                  <div className="inline-flex items-center gap-1.5 mb-2 text-[11px] font-semibold tracking-wide text-sky-300 bg-sky-950/40 border border-sky-800/50 rounded px-2 py-0.5">
                    📋 후보 작성 공약 <span className="font-normal text-sky-400/70">(선관위 제출 원문)</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{pledge.content}</p>
                </div>
              )}

              {/* ── 시스템 추정 영역 (후보 작성 아님) ── */}
              <div className="px-4 pt-3 pb-1 bg-gray-950/30 border-b border-gray-800/40">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded px-2 py-0.5">
                  💰 시스템 추정 <span className="font-normal text-emerald-400/70">(후보 작성 아님 · NABO 표준단가 자동계산)</span>
                </div>
              </div>
              <div className="px-4 py-3 grid grid-cols-3 gap-2 bg-gray-950/30 border-b border-gray-800/60">
                <CostCell label="초기" value={won(analysis.cost.initialCost)} />
                <CostCell label="연운영" value={`${won(analysis.cost.annualOperatingCost)}/년`} />
                <CostCell label="실현성" value={analysis.cost.feasibility}
                  accent={analysis.cost.feasibility === '상' ? 'text-emerald-300' : analysis.cost.feasibility === '하' ? 'text-rose-300' : 'text-amber-300'} />
              </div>

              {/* 산출 근거 (모든 공약 표시) — 전문 표시, 클램프 없음 */}
              {analysis.cost.methodology && (
                <div className="px-4 py-3 border-t border-gray-800/60 bg-gray-950/30">
                  <div className="font-mono text-xs uppercase tracking-wider text-sky-400/80 mb-1.5">산출 근거</div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{analysis.cost.methodology}</p>
                </div>
              )}

              {/* 비용 항목 분해 */}
              {analysis.cost.costItems?.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800/60">
                  <div className="font-mono text-xs uppercase tracking-wider text-emerald-400/80 mb-2">비용 항목</div>
                  <ul className="space-y-1.5">
                    {analysis.cost.costItems.map((item, k) => (
                      <li key={k} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-gray-400 leading-snug min-w-0">
                          {item.category}
                          {item.note && <span className="block text-xs text-gray-600">{item.note}</span>}
                        </span>
                        <span className="font-mono text-sm text-emerald-300/90 shrink-0 tabular-nums">{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 벤치마크 / 출처 */}
              {analysis.cost.benchmarks?.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800/60 bg-gray-950/30">
                  <div className="font-mono text-xs uppercase tracking-wider text-amber-400/80 mb-2">벤치마크 / 출처</div>
                  <ul className="space-y-2">
                    {analysis.cost.benchmarks.map((b, k) => (
                      <li key={k} className="text-sm text-gray-400 leading-relaxed">
                        <span className="text-gray-300">{b.description}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          — {b.url ? (
                            <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-sky-400/90 hover:text-sky-300 underline underline-offset-2">{b.source}</a>
                          ) : b.source}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
          <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t border-gray-800/60">
            ※ 비용은 표준단가 기반 개략 추정치(가정)이며 정책 효과(효용)는 단정하지 않습니다.
          </p>
        </div>
      </aside>
    </div>
  );
}

function MiniStat({ label, value, accent = 'text-gray-100' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-gray-900/70 px-2 py-2 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-mono text-base font-semibold mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="font-mono text-xs tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function CostCell({ label, value, accent = 'text-gray-200' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-mono text-sm font-medium mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}

// hex(#rrggbb) + alpha → rgba 문자열 (동적 셀 농도용)
function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
