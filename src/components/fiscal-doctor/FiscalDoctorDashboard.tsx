'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getDistrictFiscalData,
  getMetroNames,
} from '@/lib/data/fiscal-health-data';
import { getPolicyRecommendations, SOCIAL_POLICY_SUGGESTIONS } from '@/lib/data/regional-policy-recommendations';
import type {
  DiagnosisResult,
  PolicySimResult,
  ResidentPerspective,
  PoliticalPerspective,
  MultiPerspectiveResult,
} from './types';
import { BillSearch } from './BillSearch';
import { OrdinanceSearch } from './OrdinanceSearch';
import { GlobalBenchmark } from './GlobalBenchmark';
import { PolicyChatbot } from './PolicyChatbot';
import { SimulationActions } from './SimulationActions';
import { SimulationResults } from './SimulationResults';
import { FiscalRadarChart, ScoreBar, ComparisonBar, GradeBadge } from './DiagnosisCharts';

// ─── Main Dashboard ───
export function FiscalDoctorDashboard() {
  const searchParams = useSearchParams();

  // Region selection state
  const [regionTab, setRegionTab] = useState<'metro' | 'district'>(
    (searchParams.get('type') as 'metro' | 'district') || 'metro',
  );
  const metroNames = useMemo(() => getMetroNames(), []);
  const defaultMetro = searchParams.get('metro') || metroNames[0] || '서울특별시';
  const [selectedMetroName, setSelectedMetroName] = useState(defaultMetro);

  const districtList = useMemo(
    () => getDistrictFiscalData(selectedMetroName),
    [selectedMetroName],
  );
  const defaultDistrict = searchParams.get('district') || districtList[0]?.name || '';
  const [selectedDistrictName, setSelectedDistrictName] = useState(defaultDistrict);

  // Diagnosis state
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Policy simulation state
  const [policyText, setPolicyText] = useState('');
  const [policyCategory, setPolicyCategory] = useState('auto');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<MultiPerspectiveResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulation history state
  const [showHistory, setShowHistory] = useState(false);
  const [simHistory, setSimHistory] = useState<Array<{
    id: string;
    region: string;
    policy: string;
    date: string;
    grade: string;
    projectedGrade: string;
    initialCost: string;
    isFallback: boolean;
  }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sim-history');
      if (stored) setSimHistory(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
    }
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMetroChange = useCallback((metro: string) => {
    setSelectedMetroName(metro);
    const districts = getDistrictFiscalData(metro);
    if (districts.length > 0) setSelectedDistrictName(districts[0].name);
  }, []);

  const handleDiagnose = useCallback(async () => {
    setSimResult(null);
    setSimError(null);
    setPolicyText('');
    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const body = regionTab === 'metro'
        ? { regionType: 'metro', regionName: selectedMetroName }
        : { regionType: 'district', regionName: selectedDistrictName };

      const res = await fetch('/api/chat/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '진단에 실패했습니다. 다시 시도해주세요.'); return; }
      setDiagnosis(data);
      setCooldown(5);
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [regionTab, selectedMetroName, selectedDistrictName]);

  const handleSimulate = useCallback(async () => {
    if (!policyText.trim() || !diagnosis || cooldown > 0) return;
    setSimulating(true);
    setSimError(null);
    setSimResult(null);

    const body = regionTab === 'metro'
      ? { regionType: 'metro', regionName: selectedMetroName, policyText: policyText.trim(), ...(policyCategory !== 'auto' && { category: policyCategory }) }
      : { regionType: 'district', regionName: selectedDistrictName, policyText: policyText.trim(), ...(policyCategory !== 'auto' && { category: policyCategory }) };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/chat/diagnosis/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (res.status === 429 && data.retryAfter && attempt === 0) {
          const waitSec = Math.min(data.retryAfter, 20);
          setCooldown(waitSec);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          setCooldown(0);
          continue;
        }

        if (!res.ok) { setSimError(data.error || '시뮬레이션에 실패했습니다.'); setSimulating(false); return; }

        if (data.fiscal) {
          setSimResult(data as MultiPerspectiveResult);
        } else {
          setSimResult({
            fiscal: data as PolicySimResult,
            resident: null as unknown as ResidentPerspective,
            political: null as unknown as PoliticalPerspective,
            synthesis: '',
            isFallback: data.isFallback,
          });
        }

        const historyEntry = {
          id: Date.now().toString(36),
          region: selectedMetroName,
          policy: policyText,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          grade: data.fiscal?.currentGrade || data.currentGrade || '?',
          projectedGrade: data.fiscal?.projectedGrade || data.projectedGrade || '?',
          initialCost: data.fiscal?.costBreakdown?.totalInitialCost || data.costBreakdown?.totalInitialCost || '?',
          isFallback: !!data.isFallback,
        };
        setSimHistory(prev => {
          const updated = [historyEntry, ...prev].slice(0, 20);
          try { localStorage.setItem('sim-history', JSON.stringify(updated)); } catch {}
          return updated;
        });
        setCooldown(10);
        setSimulating(false);
        return;
      } catch {
        setSimError('네트워크 오류가 발생했습니다.');
        setSimulating(false);
        return;
      }
    }
    setSimulating(false);
  }, [policyText, diagnosis, regionTab, selectedMetroName, selectedDistrictName, cooldown, policyCategory]);

  const currentRegionType = regionTab;
  const currentRegionName = regionTab === 'metro' ? selectedMetroName : selectedDistrictName;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">AI 정책진단 — 지역 재정 건강 진단</h1>
          <p className="text-gray-500 text-sm">AI가 지역 재정 데이터를 분석하고 건전성 등급과 정책 시뮬레이션을 제공합니다.</p>
        </div>

        {/* Region Selector */}
        <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              <button onClick={() => setRegionTab('metro')} className={`px-3 py-2 text-sm rounded-lg transition-colors ${regionTab === 'metro' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>광역시도</button>
              <button onClick={() => setRegionTab('district')} className={`px-3 py-2 text-sm rounded-lg transition-colors ${regionTab === 'district' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>시군구</button>
            </div>
            <select value={selectedMetroName} onChange={(e) => handleMetroChange(e.target.value)} className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              {metroNames.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>
            {regionTab === 'district' && (
              <select value={selectedDistrictName} onChange={(e) => setSelectedDistrictName(e.target.value)} className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                {districtList.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
              </select>
            )}
            <button onClick={handleDiagnose} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? '진단 중...' : '진단하기'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="border border-gray-800 rounded-xl p-12 bg-gray-900/50 flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-400 animate-pulse">AI가 재정 진단 중입니다...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={handleDiagnose} className="mt-3 px-4 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">다시 시도</button>
          </div>
        )}

        {/* Diagnosis Results */}
        {diagnosis && !loading && (
          <div id="diagnosis" className="space-y-6">
            {/* Grade Card + Radar + Score Bars */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-200">{diagnosis.regionData.name} 재정 건전성 진단서</h2>
                <span className="text-xs text-gray-500">{diagnosis.comparisons.totalRegions}개 지역 중 {diagnosis.comparisons.rank}위</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center gap-6">
                  <GradeBadge grade={diagnosis.grade} score={diagnosis.score} />
                  <FiscalRadarChart breakdown={diagnosis.breakdown} />
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  <ScoreBar label="재정자립도" score={diagnosis.breakdown.independence} max={30} color="text-emerald-400" />
                  <ScoreBar label="재정자주도" score={diagnosis.breakdown.autonomy} max={25} color="text-blue-400" />
                  <ScoreBar label="채무비율" score={diagnosis.breakdown.debtRatio} max={25} color="text-amber-400" />
                  <ScoreBar label="1인당채무" score={diagnosis.breakdown.debtPerCapita} max={20} color="text-purple-400" />
                </div>
              </div>
            </div>

            {/* AI Diagnosis Text */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-3">
              <h2 className="text-lg font-semibold text-gray-200">AI 진단문</h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{diagnosis.diagnosis}</div>
            </div>

            {/* Policy Simulation */}
            {diagnosis && (
              <div id="simulation" className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  정책 시뮬레이션
                  <span className="ml-2 text-sm text-gray-500 font-normal">내 정책 아이디어의 재정 영향을 AI가 분석합니다</span>
                </h2>

                <div className="flex gap-3">
                  <input type="text" value={policyText} onChange={(e) => setPolicyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSimulate()} placeholder="정책을 입력하세요 (예: 주민세 10% 인상, 공공병원 신설, 지역화폐 도입...)" maxLength={500} className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-gray-600" />
                  <select value={policyCategory} onChange={(e) => setPolicyCategory(e.target.value)} className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500">
                    <option value="auto">분야: 자동감지</option>
                    <option value="hospital">병원/의료</option>
                    <option value="bank">금융/은행</option>
                    <option value="digitalCurrency">디지털화폐</option>
                    <option value="ai">AI/디지털</option>
                    <option value="infrastructure">도로/교통</option>
                    <option value="education">교육</option>
                    <option value="housing">주택/주거</option>
                    <option value="welfare">복지/돌봄</option>
                    <option value="environment">환경/에너지</option>
                    <option value="tourism">관광</option>
                    <option value="culture">문화/체육</option>
                    <option value="labor">노동/고용</option>
                    <option value="general">일반</option>
                  </select>
                  <button onClick={handleSimulate} disabled={simulating || !policyText.trim() || cooldown > 0} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                    {simulating ? '분석 중...' : cooldown > 0 ? `${cooldown}초 후 가능` : '시뮬레이션'}
                  </button>
                </div>

                {/* ① 지역별 맞춤 정책 추천 — currentRegionName 기반 동적 렌더링 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-gray-500 tracking-wide">
                    {currentRegionType === 'metro'
                      ? `💡 ${currentRegionName} 맞춤 정책 추천`
                      : `💡 ${currentRegionName}에 자주 거론되는 정책`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getPolicyRecommendations(currentRegionName).map((sug) =>
                      sug.highlight ? (
                        <button
                          key={sug.text}
                          onClick={() => setPolicyText(sug.text)}
                          className="group text-xs px-3 py-1.5 rounded-full border transition-all relative
                                     bg-gradient-to-r from-emerald-600/30 to-cyan-600/30
                                     hover:from-emerald-500/50 hover:to-cyan-500/50
                                     text-emerald-200 hover:text-white
                                     border-emerald-500/60 hover:border-emerald-400
                                     shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:shadow-[0_0_16px_rgba(16,185,129,0.6)]
                                     font-semibold"
                          title={sug.rationale ?? ''}
                        >
                          {sug.icon && <span className="mr-1">{sug.icon}</span>}
                          {sug.text}
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 align-middle">
                            NEW
                          </span>
                        </button>
                      ) : (
                        <button
                          key={sug.text}
                          onClick={() => setPolicyText(sug.text)}
                          className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-gray-300 transition-colors border border-gray-700/50"
                          title={sug.rationale ?? ''}
                        >
                          {sug.icon && <span className="mr-1">{sug.icon}</span>}
                          {sug.text}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* ② 사회 과제 대응 정책 — 전국 공통 (부의 양극화·가계대출·AI 실업 등) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-gray-500 tracking-wide">
                    🌐 사회 과제 대응 정책 <span className="text-gray-600">(부의 양극화 · 가계대출 · AI 전환)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_POLICY_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.text}
                        onClick={() => setPolicyText(sug.text)}
                        className="text-xs px-3 py-1.5 rounded-full transition-colors
                                   bg-indigo-950/40 text-indigo-200/90
                                   hover:bg-indigo-900/60 hover:text-indigo-100
                                   border border-indigo-700/40 hover:border-indigo-500/60"
                        title={sug.rationale ?? ''}
                      >
                        {sug.icon && <span className="mr-1">{sug.icon}</span>}
                        {sug.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation History */}
                {simHistory.length > 0 && (
                  <div className="space-y-2">
                    <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {showHistory ? '시뮬레이션 이력 닫기' : `시뮬레이션 이력 (${simHistory.length}건)`}
                    </button>
                    {showHistory && (
                      <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {simHistory.map((h) => (
                          <button key={h.id} onClick={() => setPolicyText(h.policy)} className="w-full text-left px-3 py-2 rounded bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 transition-colors group">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300 group-hover:text-cyan-300 truncate flex-1">{h.policy}</span>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                <span className="text-xs text-gray-500">{h.grade}→{h.projectedGrade}</span>
                                <span className="text-xs text-gray-600">{h.initialCost}</span>
                                {h.isFallback && <span className="text-xs text-amber-500">규칙</span>}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">{h.region} | {h.date}</div>
                          </button>
                        ))}
                        <button onClick={() => { setSimHistory([]); localStorage.removeItem('sim-history'); }} className="text-xs text-red-400/60 hover:text-red-400 mt-1">이력 삭제</button>
                      </div>
                    )}
                  </div>
                )}

                <BillSearch onSelectBill={(name) => setPolicyText(name)} />
                <OrdinanceSearch onSelectOrdinance={(name) => setPolicyText(name)} />
                <GlobalBenchmark regionType={currentRegionType} regionName={currentRegionName} onSelectPolicy={(name) => setPolicyText(name)} />
                <PolicyChatbot regionType={currentRegionType} regionName={currentRegionName} />

                {simulating && (
                  <div className="flex items-center gap-3 py-4 justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span className="text-gray-400 text-sm animate-pulse">AI가 &quot;{policyText}&quot; 정책의 재정 영향을 분석 중...</span>
                  </div>
                )}

                {simError && (
                  <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4 text-center">
                    <p className="text-red-400 text-sm">{simError}</p>
                  </div>
                )}

                {simResult && !simulating && (
                  <div className="space-y-4 pt-2">
                    <SimulationActions simResult={simResult} regionName={selectedMetroName} policyText={policyText} />
                    <SimulationResults simResult={simResult} diagnosis={diagnosis} />
                  </div>
                )}
              </div>
            )}

            {/* Comparison Analysis */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-4">
              <h2 className="text-lg font-semibold text-gray-200">전국 평균 비교</h2>
              <div className="space-y-5">
                <ComparisonBar label="재정자립도" value={diagnosis.regionData.independence} nationalAvg={diagnosis.comparisons.nationalAvgIndependence} unit="%" />
                <ComparisonBar label="재정자주도" value={diagnosis.regionData.autonomy} nationalAvg={diagnosis.comparisons.nationalAvgAutonomy} unit="%" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">예산규모</div>
                  <div className="text-sm font-semibold text-gray-200">{diagnosis.regionData.budget.toLocaleString()}억</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">인구</div>
                  <div className="text-sm font-semibold text-gray-200">{diagnosis.regionData.population.toLocaleString()}명</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">지역채무</div>
                  <div className="text-sm font-semibold text-gray-200">{diagnosis.regionData.debt.toLocaleString()}억</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">전국 순위</div>
                  <div className="text-sm font-semibold text-gray-200">{diagnosis.comparisons.rank}/{diagnosis.comparisons.totalRegions}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!diagnosis && !loading && !error && (
          <div className="border border-gray-800 border-dashed rounded-xl p-12 bg-gray-900/30 flex flex-col items-center gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <p className="text-gray-500 text-sm">위에서 지역을 선택하고 &quot;진단하기&quot; 버튼을 눌러주세요.</p>
            <p className="text-gray-600 text-xs">AI가 재정 데이터를 분석하여 건전성 등급과 정책 시뮬레이션을 제공합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
