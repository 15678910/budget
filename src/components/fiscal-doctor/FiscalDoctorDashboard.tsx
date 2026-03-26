'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getMetroNames,
} from '@/lib/data/fiscal-health-data';
import type {
  DiagnosisResult,
  PolicySimResult,
  ResidentPerspective,
  PoliticalPerspective,
  MultiPerspectiveResult,
} from './types';
import { downloadAsCSV, downloadAsJSON, downloadAsPDF } from './download-helpers';

// ─── Helpers ───

/** Safely format a number that might be absurdly large (Gemini sometimes returns won instead of 억원) */
function formatDebtChange(val: number | string): string {
  const n = Number(val);
  if (isNaN(n)) return String(val);
  // If absolute value >= 100000, Gemini probably returned in 만원 or 원 units → convert
  if (Math.abs(n) >= 1000000) {
    // Likely in 만원 or 원 → convert to 억원
    const billions = n / 100000000; // 원 → 억원
    if (Math.abs(billions) >= 1 && Math.abs(billions) < 100000) {
      return (billions > 0 ? '+' : '') + billions.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    const tenThousands = n / 10000; // 만원 → 억원
    if (Math.abs(tenThousands) >= 1 && Math.abs(tenThousands) < 100000) {
      return (tenThousands > 0 ? '+' : '') + tenThousands.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    // Still too big, just show in 조원
    const trillions = n / 10000;
    return (trillions > 0 ? '+' : '') + trillions.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return (n > 0 ? '+' : '') + n.toLocaleString();
}

function formatIndependenceChange(val: number | string): string {
  const n = Number(val);
  if (isNaN(n)) return String(val);
  // Clamp to reasonable range -100 to +100
  const clamped = Math.max(-100, Math.min(100, n));
  return (clamped >= 0 ? '+' : '') + clamped.toFixed(1);
}

/** Safely convert any value to a renderable string (Gemini sometimes returns objects instead of strings) */
function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return Object.values(item as Record<string, unknown>).join(' / ');
      }
      return String(item);
    }).join('\n');
  }
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return String(val);
}

// ─── Sub-components ───

function FiscalRadarChart({
  breakdown,
}: {
  breakdown: { independence: number; autonomy: number; debtRatio: number; debtPerCapita: number };
}) {
  const axes = [
    { label: '자립도', value: breakdown.independence, max: 30 },
    { label: '자주도', value: breakdown.autonomy, max: 25 },
    { label: '채무비율', value: breakdown.debtRatio, max: 25 },
    { label: '1인당채무', value: breakdown.debtPerCapita, max: 20 },
  ];

  const size = 240;
  const center = size / 2;
  const maxR = size / 2 - 36;
  const n = axes.length;
  const angles = axes.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const pt = (angle: number, fraction: number) => ({
    x: center + maxR * fraction * Math.cos(angle),
    y: center + maxR * fraction * Math.sin(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = rings.map((r) => {
    const pts = angles.map((a) => pt(a, r));
    return `M${pts.map((p) => `${p.x},${p.y}`).join(' L')} Z`;
  });

  const dataPoints = axes.map((d, i) => pt(angles[i], d.value / d.max));
  const dataPath = `M${dataPoints.map((p) => `${p.x},${p.y}`).join(' L')} Z`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto">
      {gridPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#374151"
          strokeWidth="0.5"
          strokeDasharray={i < 3 ? '3,3' : undefined}
        />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="#374151"
            strokeWidth="0.5"
          />
        );
      })}
      <path d={dataPath} fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#030712" strokeWidth="1.5" />
      ))}
      {axes.map((d, i) => {
        const labelR = maxR + 24;
        const lx = center + labelR * Math.cos(angles[i]);
        const ly = center + labelR * Math.sin(angles[i]);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#9ca3af"
            fontSize="11"
            fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((score / max) * 100);
  // Map text-* color to bg-* for the bar
  const bgColor = color.replace('text-', 'bg-');
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={color}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


function ComparisonBar({
  label,
  value,
  nationalAvg,
  unit,
}: {
  label: string;
  value: number;
  nationalAvg: number;
  unit: string;
}) {
  const maxVal = Math.max(value, nationalAvg) * 1.2;
  const valuePct = Math.round((value / maxVal) * 100);
  const avgPct = Math.round((nationalAvg / maxVal) * 100);
  const isAbove = value >= nationalAvg;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={isAbove ? 'text-emerald-400' : 'text-red-400'}>
          {value.toFixed(1)}
          {unit} {isAbove ? '(평균 이상)' : '(평균 이하)'}
        </span>
      </div>
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${isAbove ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
          style={{ width: `${valuePct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-yellow-400"
          style={{ left: `${avgPct}%` }}
          title={`전국평균: ${nationalAvg.toFixed(1)}${unit}`}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs text-yellow-400/70">
          전국평균 {nationalAvg.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Grade badge ───
function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const gradeStyles: Record<string, string> = {
    A: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30',
    B: 'from-blue-500 to-blue-700 shadow-blue-500/30',
    C: 'from-amber-500 to-amber-700 shadow-amber-500/30',
    D: 'from-orange-500 to-orange-700 shadow-orange-500/30',
    F: 'from-red-500 to-red-700 shadow-red-500/30',
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradeStyles[grade] ?? gradeStyles.C} shadow-lg flex items-center justify-center`}
      >
        <span className="text-3xl font-black text-white">{grade}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-100">
          {score}
          <span className="text-lg text-gray-500">/100</span>
        </div>
        <div className="text-sm text-gray-500">건전성 점수</div>
      </div>
    </div>
  );
}

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
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bill search state
  const [showBillSearch, setShowBillSearch] = useState(false);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billResults, setBillResults] = useState<Array<{
    id: string;
    billNo: string;
    name: string;
    proposer: string;
    proposeDate: string;
    committee: string | null;
    status: string | null;
    detailLink: string;
  }>>([]);
  const [billSearching, setBillSearching] = useState(false);
  const [billTotal, setBillTotal] = useState(0);
  const [billPage, setBillPage] = useState(1);

  // Ordinance search state
  const [showOrdinanceSearch, setShowOrdinanceSearch] = useState(false);
  const [ordinanceQuery, setOrdinanceQuery] = useState('');
  const [ordinanceResults, setOrdinanceResults] = useState<Array<{
    id: string;
    name: string;
    promulgationDate: string;
    effectiveDate: string;
    localGov: string;
    amendmentType: string;
    field: string;
  }>>([]);
  const [ordinanceSearching, setOrdinanceSearching] = useState(false);
  const [ordinanceTotal, setOrdinanceTotal] = useState(0);
  const [ordinancePage, setOrdinancePage] = useState(1);

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

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sim-history');
      if (stored) setSimHistory(JSON.parse(stored));
    } catch {}
  }, []);

  // Global benchmarking state
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<{
    matchingCities: Array<{
      name: string;
      country: string;
      population: number;
      similarityScore: number;
      matchReasons: string[];
      strengths: string[];
      fiscalStrategy: string;
      qualityOfLifeRank: number;
      gdpPerCapita: number;
      fiscalIndependence: number;
      source: string;
      policies: Array<{
        name: string;
        category: string;
        description: string;
        impact: string;
        applicability: string;
        koreanContext: string;
      }>;
    }>;
    recommendations: Array<{
      rank: number;
      policyName: string;
      benchmarkCity: string;
      country: string;
      category: string;
      description: string;
      estimatedCost: string;
      expectedImpact: string;
      timeline: string;
      applicability: string;
      koreanContext: string;
      implementationSteps: string[];
    }>;
  } | null>(null);
  const [activeCityDetail, setActiveCityDetail] = useState<string | null>(null);

  // Policy chatbot state
  const [showPolicyChat, setShowPolicyChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Cooldown timer effect
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

  // Bill search from National Assembly API
  const handleBillSearch = useCallback(async (page = 1) => {
    setBillSearching(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '8' });
      if (billSearchQuery.trim()) {
        params.set('search', billSearchQuery.trim());
      }
      const res = await fetch(`/api/nabo/bills?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setBillResults(data.bills || []);
      setBillTotal(data.total || 0);
      setBillPage(page);
    } catch {
      setBillResults([]);
      setBillTotal(0);
    } finally {
      setBillSearching(false);
    }
  }, [billSearchQuery]);

  const handleSelectBill = useCallback((billName: string) => {
    setPolicyText(billName);
    setShowBillSearch(false);
  }, []);

  // Ordinance search
  const handleOrdinanceSearch = useCallback(async (page = 1) => {
    if (!ordinanceQuery.trim() || ordinanceQuery.trim().length < 2) return;
    setOrdinanceSearching(true);
    try {
      const params = new URLSearchParams({ query: ordinanceQuery.trim(), page: String(page), size: '8' });
      const res = await fetch(`/api/ordinance/search?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setOrdinanceResults(data.ordinances || []);
      setOrdinanceTotal(data.total || 0);
      setOrdinancePage(page);
    } catch {
      setOrdinanceResults([]);
      setOrdinanceTotal(0);
    } finally {
      setOrdinanceSearching(false);
    }
  }, [ordinanceQuery]);

  const handleSelectOrdinance = useCallback((name: string) => {
    setPolicyText(name);
    setShowOrdinanceSearch(false);
  }, []);

  const handleFetchBenchmark = useCallback(async () => {
    setBenchmarkLoading(true);
    try {
      const type = regionTab;
      const name = regionTab === 'metro' ? selectedMetroName : selectedDistrictName;
      const res = await fetch(`/api/chat/diagnosis/recommend?regionType=${type}&regionName=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBenchmarkData(data);
    } catch {
      setBenchmarkData(null);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [regionTab, selectedMetroName, selectedDistrictName]);

  const handlePolicyChat = useCallback(async (question: string) => {
    if (!question.trim() || chatLoading) return;
    const userMsg = { role: 'user' as const, content: question.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }],
      }));
      const type = regionTab;
      const name = regionTab === 'metro' ? selectedMetroName : selectedDistrictName;
      const res = await fetch('/api/chat/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), regionType: type, regionName: name, history }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'AI 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, chatLoading, regionTab, selectedMetroName, selectedDistrictName]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // When metro changes and tab is district, reset district selection
  const handleMetroChange = useCallback(
    (metro: string) => {
      setSelectedMetroName(metro);
      const districts = getDistrictFiscalData(metro);
      if (districts.length > 0) {
        setSelectedDistrictName(districts[0].name);
      }
    },
    [],
  );

  const handleDiagnose = useCallback(async () => {
    setSimResult(null);
    setSimError(null);
    setPolicyText('');
    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const body =
        regionTab === 'metro'
          ? { regionType: 'metro', regionName: selectedMetroName }
          : { regionType: 'district', regionName: selectedDistrictName };

      const res = await fetch('/api/chat/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '진단에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      setDiagnosis(data);
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

    // Auto-retry: if 429, wait retryAfter seconds and try once more
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/chat/diagnosis/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.status === 429 && data.retryAfter && attempt === 0) {
          // Auto-retry: wait and try once more
          const waitSec = Math.min(data.retryAfter, 20);
          setCooldown(waitSec);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          setCooldown(0);
          continue; // retry
        }

        if (!res.ok) {
          setSimError(data.error || '시뮬레이션에 실패했습니다.');
          setSimulating(false);
          return;
        }

        // Handle multi-perspective response
        if (data.fiscal) {
          setSimResult(data as MultiPerspectiveResult);
        } else {
          // Legacy single-perspective response - wrap it
          setSimResult({
            fiscal: data as PolicySimResult,
            resident: null as unknown as ResidentPerspective,
            political: null as unknown as PoliticalPerspective,
            synthesis: '',
            isFallback: data.isFallback,
          });
        }
        // Save to history
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
          const updated = [historyEntry, ...prev].slice(0, 20); // Keep last 20
          try { localStorage.setItem('sim-history', JSON.stringify(updated)); } catch {}
          return updated;
        });
        setCooldown(10); // 10s cooldown after success
        setSimulating(false);
        return;
      } catch {
        setSimError('네트워크 오류가 발생했습니다.');
        setSimulating(false);
        return;
      }
    }
    setSimulating(false);
  }, [policyText, diagnosis, regionTab, selectedMetroName, selectedDistrictName, cooldown]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ─── Header ─── */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
            AI 정책진단 — 지역 재정 건강 진단
          </h1>
          <p className="text-gray-500 text-sm">
            AI가 지역 재정 데이터를 분석하고 건전성 등급과 정책 시뮬레이션을 제공합니다.
          </p>
        </div>

        {/* ─── Region Selector ─── */}
        <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/50">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tab toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setRegionTab('metro')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  regionTab === 'metro'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                광역시도
              </button>
              <button
                onClick={() => setRegionTab('district')}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  regionTab === 'district'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                시군구
              </button>
            </div>

            {/* Selectors - inline */}
            <select
              value={selectedMetroName}
              onChange={(e) => handleMetroChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {metroNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {regionTab === 'district' && (
              <select
                value={selectedDistrictName}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {districtList.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleDiagnose}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '진단 중...' : '진단하기'}
            </button>
          </div>
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="border border-gray-800 rounded-xl p-12 bg-gray-900/50 flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-400 animate-pulse">AI가 재정 진단 중입니다...</p>
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleDiagnose}
              className="mt-3 px-4 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* ─── Diagnosis Results ─── */}
        {diagnosis && !loading && (
          <div id="diagnosis" className="space-y-6">
            {/* Grade Card + Radar + Score Bars */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-200">
                  {diagnosis.regionData.name} 재정 건전성 진단서
                </h2>
                <span className="text-xs text-gray-500">
                  {diagnosis.comparisons.totalRegions}개 지역 중 {diagnosis.comparisons.rank}위
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Grade + Radar */}
                <div className="flex flex-col items-center gap-6">
                  <GradeBadge grade={diagnosis.grade} score={diagnosis.score} />
                  <FiscalRadarChart breakdown={diagnosis.breakdown} />
                </div>

                {/* Right: Score Bars */}
                <div className="space-y-4 flex flex-col justify-center">
                  <ScoreBar
                    label="재정자립도"
                    score={diagnosis.breakdown.independence}
                    max={30}
                    color="text-emerald-400"
                  />
                  <ScoreBar
                    label="재정자주도"
                    score={diagnosis.breakdown.autonomy}
                    max={25}
                    color="text-blue-400"
                  />
                  <ScoreBar
                    label="채무비율"
                    score={diagnosis.breakdown.debtRatio}
                    max={25}
                    color="text-amber-400"
                  />
                  <ScoreBar
                    label="1인당채무"
                    score={diagnosis.breakdown.debtPerCapita}
                    max={20}
                    color="text-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* AI Diagnosis Text */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-3">
              <h2 className="text-lg font-semibold text-gray-200">AI 진단문</h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {diagnosis.diagnosis}
              </div>
            </div>

            {/* Policy Simulation */}
            {diagnosis && (
              <div id="simulation" className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  정책 시뮬레이션
                  <span className="ml-2 text-sm text-gray-500 font-normal">
                    내 정책 아이디어의 재정 영향을 AI가 분석합니다
                  </span>
                </h2>

                {/* Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                    placeholder="정책을 입력하세요 (예: 주민세 10% 인상, 공공병원 신설, 지역화폐 도입...)"
                    maxLength={500}
                    className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                  />
                  <select
                    value={policyCategory}
                    onChange={(e) => setPolicyCategory(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                  >
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
                  <button
                    onClick={handleSimulate}
                    disabled={simulating || !policyText.trim() || cooldown > 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    {simulating ? '분석 중...' : cooldown > 0 ? `${cooldown}초 후 가능` : '시뮬레이션'}
                  </button>
                </div>

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-2">
                  {['주민세 10% 인상', '공공병원 신설', '지역화폐 30% 확대', '공무원 5% 감축', '관광특구 지정'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setPolicyText(suggestion)}
                      className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-gray-300 transition-colors border border-gray-700/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Simulation History */}
                {simHistory.length > 0 && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {showHistory ? '시뮬레이션 이력 닫기' : `시뮬레이션 이력 (${simHistory.length}건)`}
                    </button>

                    {showHistory && (
                      <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {simHistory.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => setPolicyText(h.policy)}
                            className="w-full text-left px-3 py-2 rounded bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 transition-colors group"
                          >
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
                        <button
                          onClick={() => {
                            setSimHistory([]);
                            localStorage.removeItem('sim-history');
                          }}
                          className="text-xs text-red-400/60 hover:text-red-400 mt-1"
                        >
                          이력 삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* National Assembly Bill Search */}
                <div id="bill-search" className="space-y-3">
                  <button
                    onClick={() => {
                      setShowBillSearch(!showBillSearch);
                      if (!showBillSearch && billResults.length === 0) {
                        handleBillSearch(1);
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-7m0 0l-7 7m7-7V3" />
                    </svg>
                    {showBillSearch ? '국회 법률안 검색 닫기' : '국회 법률안에서 검색'}
                    <span className="text-xs text-gray-600">(열린국회정보 API)</span>
                  </button>

                  {showBillSearch && (
                    <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={billSearchQuery}
                          onChange={(e) => setBillSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBillSearch(1)}
                          placeholder="법률안 정식 명칭 일부로 검색 (예: 인공지능, 지방재정, 주민세, 공공의료...)"
                          className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                        />
                        <button
                          onClick={() => handleBillSearch(1)}
                          disabled={billSearching}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                        >
                          {billSearching ? '검색 중...' : '검색'}
                        </button>
                      </div>

                      {billTotal > 0 && (
                        <p className="text-xs text-gray-500">
                          총 {billTotal.toLocaleString()}건의 법률안 (제22대 국회)
                        </p>
                      )}

                      {billResults.length > 0 && (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {billResults.map((bill) => (
                            <button
                              key={bill.id}
                              onClick={() => handleSelectBill(bill.name)}
                              className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 hover:border-blue-500/30 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-200 group-hover:text-blue-300 truncate">
                                    {bill.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">{bill.proposer}</span>
                                    <span className="text-xs text-gray-600">|</span>
                                    <span className="text-xs text-gray-500">{bill.proposeDate}</span>
                                    {bill.committee && (
                                      <>
                                        <span className="text-xs text-gray-600">|</span>
                                        <span className="text-xs text-gray-500">{bill.committee}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-1">
                                  선택
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {billResults.length === 0 && !billSearching && billSearchQuery && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          검색 결과가 없습니다
                        </p>
                      )}

                      {billTotal > 8 && (
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={() => handleBillSearch(billPage - 1)}
                            disabled={billPage <= 1 || billSearching}
                            className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            이전
                          </button>
                          <span className="text-xs text-gray-500 py-1">
                            {billPage} / {Math.ceil(billTotal / 8)}
                          </span>
                          <button
                            onClick={() => handleBillSearch(billPage + 1)}
                            disabled={billPage >= Math.ceil(billTotal / 8) || billSearching}
                            className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            다음
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-gray-600 text-right">
                        출처: 열린국회정보 (open.assembly.go.kr)
                      </p>
                    </div>
                  )}
                </div>

                {/* Ordinance (조례) Search */}
                <div id="ordinance-search" className="space-y-3">
                  <button
                    onClick={() => setShowOrdinanceSearch(!showOrdinanceSearch)}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {showOrdinanceSearch ? '지자체 조례 검색 닫기' : '지자체 조례에서 검색'}
                    <span className="text-xs text-gray-600">(국가법령정보센터)</span>
                  </button>

                  {showOrdinanceSearch && (
                    <div className="border border-gray-700 rounded-lg bg-gray-800/50 p-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ordinanceQuery}
                          onChange={(e) => setOrdinanceQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOrdinanceSearch(1)}
                          placeholder="조례명으로 검색 (예: 지역화폐, 공공의료, 마을기업, 기본소득...)"
                          className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                        />
                        <button
                          onClick={() => handleOrdinanceSearch(1)}
                          disabled={ordinanceSearching || ordinanceQuery.trim().length < 2}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                        >
                          {ordinanceSearching ? '검색 중...' : '검색'}
                        </button>
                      </div>

                      {ordinanceTotal > 0 && (
                        <p className="text-xs text-gray-500">
                          총 {ordinanceTotal.toLocaleString()}건의 조례
                        </p>
                      )}

                      {ordinanceResults.length > 0 && (
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                          {ordinanceResults.map((ord) => (
                            <button
                              key={ord.id}
                              onClick={() => handleSelectOrdinance(ord.name)}
                              className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-700/50 border border-gray-700/30 hover:border-purple-500/30 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-200 group-hover:text-purple-300 truncate">
                                    {ord.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-purple-400/80">{ord.localGov}</span>
                                    <span className="text-xs text-gray-600">|</span>
                                    <span className="text-xs text-gray-500">{ord.amendmentType}</span>
                                    <span className="text-xs text-gray-600">|</span>
                                    <span className="text-xs text-gray-500">{ord.promulgationDate}</span>
                                    {ord.field && (
                                      <>
                                        <span className="text-xs text-gray-600">|</span>
                                        <span className="text-xs text-gray-500">{ord.field}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-1">
                                  선택
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {ordinanceResults.length === 0 && !ordinanceSearching && ordinanceQuery.length >= 2 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          검색 결과가 없습니다
                        </p>
                      )}

                      {ordinanceTotal > 8 && (
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={() => handleOrdinanceSearch(ordinancePage - 1)}
                            disabled={ordinancePage <= 1 || ordinanceSearching}
                            className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            이전
                          </button>
                          <span className="text-xs text-gray-500 py-1">
                            {ordinancePage} / {Math.ceil(ordinanceTotal / 8)}
                          </span>
                          <button
                            onClick={() => handleOrdinanceSearch(ordinancePage + 1)}
                            disabled={ordinancePage >= Math.ceil(ordinanceTotal / 8) || ordinanceSearching}
                            className="px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            다음
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-gray-600 text-right">
                        출처: 국가법령정보센터 (law.go.kr)
                      </p>
                    </div>
                  )}
                </div>

                {/* Global Benchmarking & AI Policy Recommendation */}
                <div id="benchmarking" className="border-t border-gray-700/50 pt-4">
                  <button
                    onClick={() => {
                      setShowBenchmark(!showBenchmark);
                      if (!showBenchmark && !benchmarkData) {
                        handleFetchBenchmark();
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span className="text-base">🌍</span>
                    {showBenchmark ? '글로벌 벤치마킹 닫기' : '글로벌 벤치마킹 & AI 정책 추천'}
                  </button>

                  {showBenchmark && (
                    <div className="mt-3 space-y-4">
                      {benchmarkLoading && (
                        <div className="flex items-center gap-3 py-6 justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                          <span className="text-gray-400 text-sm">세계 도시 벤치마킹 분석 중...</span>
                        </div>
                      )}

                      {benchmarkData && !benchmarkLoading && (
                        <>
                          {/* Matching Cities */}
                          <div className="border border-purple-500/20 rounded-xl p-4 bg-purple-500/5">
                            <h3 className="text-sm font-semibold text-purple-300 mb-3">
                              🏙️ 벤치마크 도시 ({benchmarkData.matchingCities.length}개)
                            </h3>
                            {/* Top 3 - large cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              {benchmarkData.matchingCities.slice(0, 3).map((city, i) => (
                                <div key={city.name} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-200">{city.name}</p>
                                      <p className="text-xs text-gray-500">{city.country} · 인구 {city.population}만 · 삶의질 {city.qualityOfLifeRank}위</p>
                                    </div>
                                  </div>
                                  <div className="mb-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs text-gray-500">유사도</span>
                                      <span className="text-xs font-medium text-purple-400">{city.similarityScore}점</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${city.similarityScore}%` }} />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {city.strengths.slice(0, 4).map(s => (
                                      <button
                                        key={s}
                                        onClick={() => setActiveCityDetail(activeCityDetail === `${city.name}:${s}` ? null : `${city.name}:${s}`)}
                                        className={`text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                          activeCityDetail === `${city.name}:${s}`
                                            ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-500/50'
                                            : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                                        }`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                  {/* Strength detail popup */}
                                  {city.strengths.some(s => activeCityDetail === `${city.name}:${s}`) && (
                                    <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-3 mb-2 text-xs space-y-2">
                                      {city.policies
                                        .filter(p => {
                                          const activeStrength = activeCityDetail?.split(':')[1] || '';
                                          return p.name.includes(activeStrength) || p.description.includes(activeStrength) || p.category.includes(activeStrength.toLowerCase());
                                        })
                                        .slice(0, 1)
                                        .map(p => (
                                          <div key={p.name}>
                                            <p className="text-purple-300 font-medium mb-1">{p.name}</p>
                                            <p className="text-gray-400">{p.description}</p>
                                            <p className="text-emerald-400 mt-1">📊 효과: {p.impact}</p>
                                            <p className="text-blue-400 mt-1">🇰🇷 한국 적용: {p.koreanContext}</p>
                                          </div>
                                        ))}
                                      {city.policies
                                        .filter(p => {
                                          const activeStrength = activeCityDetail?.split(':')[1] || '';
                                          return p.name.includes(activeStrength) || p.description.includes(activeStrength) || p.category.includes(activeStrength.toLowerCase());
                                        }).length === 0 && (
                                        <div>
                                          <p className="text-gray-400">{city.name}의 핵심 강점으로, {city.fiscalStrategy}</p>
                                          <p className="text-gray-500 mt-1">1인당 GDP: ${city.gdpPerCapita?.toLocaleString()}, 재정자립도: {city.fiscalIndependence}%</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500">{city.matchReasons[0]}</p>
                                  {/* Toggle all policies */}
                                  <button
                                    onClick={() => setActiveCityDetail(activeCityDetail === city.name ? null : city.name)}
                                    className="text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors"
                                  >
                                    {activeCityDetail === city.name ? '정책 상세 닫기 ▲' : `정책 상세 보기 (${city.policies?.length || 0}건) ▼`}
                                  </button>
                                  {activeCityDetail === city.name && city.policies && (
                                    <div className="mt-2 space-y-2">
                                      {city.policies.map(p => (
                                        <div key={p.name} className="bg-gray-900/80 border border-gray-700/30 rounded p-2.5 text-xs">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-200 font-medium">{p.name}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                                              p.applicability === 'high' ? 'bg-green-500/10 text-green-400' :
                                              p.applicability === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                              'bg-red-500/10 text-red-400'
                                            }`}>
                                              {p.applicability === 'high' ? '적용↑' : p.applicability === 'medium' ? '적용○' : '적용↓'}
                                            </span>
                                          </div>
                                          <p className="text-gray-400 mb-1">{p.description}</p>
                                          <p className="text-blue-400">🇰🇷 {p.koreanContext}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Remaining cities - compact list */}
                            {benchmarkData.matchingCities.length > 3 && (
                              <div className="border-t border-purple-500/10 pt-3">
                                <p className="text-xs text-gray-500 mb-2">기타 벤치마크 도시</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {benchmarkData.matchingCities.slice(3).map((city, i) => (
                                    <div key={city.name} className="relative group">
                                      <div
                                        className="flex items-center gap-2 bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-700/20 cursor-pointer hover:border-purple-500/30 hover:bg-gray-800/50 transition-colors"
                                        onClick={() => setActiveCityDetail(activeCityDetail === `compact:${city.name}` ? null : `compact:${city.name}`)}
                                      >
                                        <span className="text-xs text-gray-500 font-medium w-4">{i + 4}</span>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-300 truncate">{city.name}</span>
                                            <span className="text-xs text-gray-600">{city.country}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-purple-400">{city.similarityScore}점</span>
                                            <div className="flex-1 bg-gray-700 rounded-full h-1 max-w-20">
                                              <div className="bg-purple-500/60 h-1 rounded-full" style={{ width: `${city.similarityScore}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-600">{city.strengths[0]}</span>
                                            <span className="text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세</span>
                                          </div>
                                        </div>
                                      </div>
                                      {/* Expanded detail panel */}
                                      {activeCityDetail === `compact:${city.name}` && (
                                        <div className="mt-1 bg-gray-900 border border-purple-500/20 rounded-lg p-3 text-xs space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-purple-300 font-medium">{city.name} ({city.country})</span>
                                            <span className="text-gray-500">삶의질 {city.qualityOfLifeRank}위 · 1인당 GDP ${city.gdpPerCapita?.toLocaleString()}</span>
                                          </div>
                                          <p className="text-gray-400">💰 재정 전략: {city.fiscalStrategy}</p>
                                          <div className="flex flex-wrap gap-1">
                                            {city.strengths.map(s => (
                                              <span key={s} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded">{s}</span>
                                            ))}
                                          </div>
                                          {city.policies && city.policies.length > 0 && (
                                            <div className="space-y-1.5 pt-1 border-t border-gray-700/30">
                                              {city.policies.map(p => (
                                                <div key={p.name} className="bg-gray-800/50 rounded p-2">
                                                  <div className="flex items-center justify-between">
                                                    <span className="text-gray-200">{p.name}</span>
                                                    <span className={`px-1 py-0.5 rounded ${
                                                      p.applicability === 'high' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                                    }`}>{p.applicability === 'high' ? '적용↑' : '적용○'}</span>
                                                  </div>
                                                  <p className="text-gray-500 mt-0.5">{p.description}</p>
                                                  <p className="text-blue-400 mt-0.5">🇰🇷 {p.koreanContext}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          <p className="text-gray-600 text-right">출처: {city.source}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Policy Recommendations */}
                          <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
                            <h3 className="text-sm font-semibold text-emerald-300 mb-3">
                              🎯 AI 정책 추천 (글로벌 벤치마킹 기반)
                            </h3>
                            <div className="space-y-3">
                              {benchmarkData.recommendations.map((rec) => (
                                <div key={rec.rank} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">#{rec.rank}</span>
                                      <h4 className="text-sm font-medium text-gray-200">{rec.policyName}</h4>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      rec.applicability === 'high' ? 'bg-green-500/10 text-green-400' :
                                      rec.applicability === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                      'bg-red-500/10 text-red-400'
                                    }`}>
                                      적용성: {rec.applicability === 'high' ? '높음' : rec.applicability === 'medium' ? '보통' : '낮음'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    📍 {rec.benchmarkCity}({rec.country}) 벤치마킹
                                  </p>
                                  <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="text-center py-1.5 bg-gray-900/50 rounded">
                                      <p className="text-xs text-gray-500">예상 비용</p>
                                      <p className="text-xs font-medium text-gray-300">{rec.estimatedCost}</p>
                                    </div>
                                    <div className="text-center py-1.5 bg-gray-900/50 rounded">
                                      <p className="text-xs text-gray-500">기대 효과</p>
                                      <p className="text-xs font-medium text-gray-300">{rec.expectedImpact}</p>
                                    </div>
                                    <div className="text-center py-1.5 bg-gray-900/50 rounded">
                                      <p className="text-xs text-gray-500">소요 기간</p>
                                      <p className="text-xs font-medium text-gray-300">{rec.timeline}</p>
                                    </div>
                                  </div>
                                  <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2 mb-2">
                                    <p className="text-xs text-blue-300">💡 한국 적용 시: {rec.koreanContext}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setPolicyText(rec.policyName);
                                      setShowBenchmark(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    → 이 정책으로 시뮬레이션하기
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Policy AI Chatbot */}
                <div id="ai-advisor" className="border-t border-gray-700/50 pt-4">
                  <button
                    onClick={() => setShowPolicyChat(!showPolicyChat)}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span className="text-base">💬</span>
                    {showPolicyChat ? '정책 AI 어드바이저 닫기' : '정책 AI 어드바이저에게 질문하기'}
                  </button>

                  {showPolicyChat && (
                    <div className="mt-3 border border-cyan-500/20 rounded-xl bg-gray-900/80 overflow-hidden">
                      {/* Chat header */}
                      <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/20">
                        <p className="text-xs text-cyan-300">
                          💡 정책에 대해 자유롭게 질문하세요. 현재 지역({regionTab === 'metro' ? selectedMetroName : selectedDistrictName}) 재정 데이터를 기반으로 답변합니다.
                        </p>
                      </div>

                      {/* Messages */}
                      <div ref={chatScrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 && (
                          <div className="text-center py-4 space-y-3">
                            <p className="text-sm text-gray-500">질문 예시:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {[
                                '이 지역에 가장 적합한 정책은?',
                                '노란봉투법이 이 지역에 미치는 영향',
                                '재정자립도를 높이려면 어떤 정책이 필요한가요?',
                                '공공은행 도입의 장단점',
                              ].map(q => (
                                <button
                                  key={q}
                                  onClick={() => handlePolicyChat(q)}
                                  className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-300 rounded-full hover:bg-cyan-500/20 transition-colors"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-800 text-gray-200 border border-gray-700/30'
                            }`}>
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          </div>
                        ))}

                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-800 border border-gray-700/30 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                                <span className="text-sm text-gray-400">AI가 분석 중...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="border-t border-gray-700/30 p-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePolicyChat(chatInput)}
                            placeholder="정책에 대해 질문하세요..."
                            className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 placeholder:text-gray-600"
                          />
                          <button
                            onClick={() => handlePolicyChat(chatInput)}
                            disabled={chatLoading || !chatInput.trim()}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                          >
                            전송
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loading */}
                {simulating && (
                  <div className="flex items-center gap-3 py-4 justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span className="text-gray-400 text-sm animate-pulse">
                      AI가 &quot;{policyText}&quot; 정책의 재정 영향을 분석 중...
                    </span>
                  </div>
                )}

                {/* Error */}
                {simError && (
                  <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-4 text-center">
                    <p className="text-red-400 text-sm">{simError}</p>
                  </div>
                )}

                {/* Results */}
                {simResult && !simulating && (
                  <div className="space-y-4 pt-2">
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
                            지역: simResult.fiscal?.regionData?.name || selectedMetroName,
                            정책: policyText,
                            분석일시: new Date().toISOString().slice(0, 10),
                            ...simResult.fiscal,
                            주민관점: simResult.resident,
                            정치관점: simResult.political,
                            종합평가: simResult.synthesis,
                          };
                          downloadAsCSV(exportData as Record<string, unknown>, `정책시뮬레이션_${selectedMetroName}_${new Date().toISOString().slice(0,10)}.csv`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = {
                            지역: simResult.fiscal?.regionData?.name || selectedMetroName,
                            정책: policyText,
                            분석일시: new Date().toISOString().slice(0, 10),
                            fiscal: simResult.fiscal,
                            resident: simResult.resident,
                            political: simResult.political,
                            synthesis: simResult.synthesis,
                          };
                          downloadAsJSON(exportData, `정책시뮬레이션_${selectedMetroName}_${new Date().toISOString().slice(0,10)}.json`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        JSON
                      </button>
                      <button
                        onClick={() => {
                          const exportData = {
                            지역: simResult.fiscal?.regionData?.name || selectedMetroName,
                            정책: policyText,
                            분석일시: new Date().toISOString().slice(0, 10),
                            ...simResult.fiscal,
                            주민관점: simResult.resident,
                            정치관점: simResult.political,
                            종합평가: simResult.synthesis,
                          };
                          downloadAsPDF(exportData as Record<string, unknown>, `정책시뮬레이션_${selectedMetroName}_${new Date().toISOString().slice(0,10)}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-600/30 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        PDF
                      </button>
                    </div>
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

                    {/* Cost Breakdown Table */}
                    {simResult.fiscal.costBreakdown && (
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
                    )}

                    {/* Scale Analysis */}
                    {simResult.fiscal.scaleAnalysis && (
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
                    )}

                    {/* Social Impact */}
                    {simResult.fiscal.socialImpact && (
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
                    )}

                    {/* Case Comparison (Best vs Worst) */}
                    {simResult.fiscal.caseComparison && (
                      <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-300">실제 사례 비교</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Best Case */}
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
                          {/* Worst Case */}
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
                    )}

                    {/* Strategic Analysis: Deficit + Government Support + Self-Sustainability + Alternatives */}
                    {simResult.fiscal.strategicAnalysis && (
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

                        {/* Government Support Analysis */}
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

                        {/* Self-Sustainability Strategy */}
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

                        {/* Alternative Policies */}
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
                    )}

                    {/* Location Analysis */}
                    {simResult.fiscal.locationAnalysis && simResult.fiscal.locationAnalysis.recommendedLocations && simResult.fiscal.locationAnalysis.recommendedLocations.length > 0 && (
                      <div className="space-y-4">
                        <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-300">최적 입지 분석</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">AI 위치 추천</span>
                          </div>

                          {/* Selection Criteria */}
                          {simResult.fiscal.locationAnalysis.selectionCriteria && (
                            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                              <div className="text-xs text-indigo-400 font-medium">입지 선정 기준</div>
                              <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.locationAnalysis.selectionCriteria)}</div>
                            </div>
                          )}

                          {/* Recommended Locations */}
                          <div className="space-y-3">
                            {simResult.fiscal.locationAnalysis.recommendedLocations.map((loc, i) => (
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

                          {/* Medical Desert Areas */}
                          {simResult.fiscal.locationAnalysis.medicalDesertAreas && (
                            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 space-y-1">
                              <div className="text-xs text-red-400 font-medium">의료 취약 지역 분석</div>
                              <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.locationAnalysis.medicalDesertAreas)}</div>
                            </div>
                          )}

                          {/* Accessibility Note */}
                          {simResult.fiscal.locationAnalysis.accessibilityNote && (
                            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-1">
                              <div className="text-xs text-cyan-400 font-medium">교통 접근성 분석</div>
                              <div className="text-sm text-gray-300 leading-relaxed">{safeString(simResult.fiscal.locationAnalysis.accessibilityNote)}</div>
                            </div>
                          )}

                          {/* Overall Recommendation */}
                          {simResult.fiscal.locationAnalysis.overallRecommendation && (
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 space-y-1">
                              <div className="text-xs text-indigo-400 font-medium">최종 입지 추천</div>
                              <div className="text-sm text-gray-200 leading-relaxed font-medium">{safeString(simResult.fiscal.locationAnalysis.overallRecommendation)}</div>
                            </div>
                          )}
                        </div>
                      </div>
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

                    {/* Similar Cases + AI Recommendation (includes grade comparison) */}
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
                          {/* Grade change badge inline */}
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

                    {/* ═══ Multi-Perspective Analysis ═══ */}
                    {simResult.resident && (
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

                          {/* Sentiment bar */}
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

                            {/* Supporting vs Opposing */}
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
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Comparison Analysis */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-4">
              <h2 className="text-lg font-semibold text-gray-200">전국 평균 비교</h2>
              <div className="space-y-5">
                <ComparisonBar
                  label="재정자립도"
                  value={diagnosis.regionData.independence}
                  nationalAvg={diagnosis.comparisons.nationalAvgIndependence}
                  unit="%"
                />
                <ComparisonBar
                  label="재정자주도"
                  value={diagnosis.regionData.autonomy}
                  nationalAvg={diagnosis.comparisons.nationalAvgAutonomy}
                  unit="%"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">예산규모</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {diagnosis.regionData.budget.toLocaleString()}억
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">인구</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {diagnosis.regionData.population.toLocaleString()}명
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">지역채무</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {diagnosis.regionData.debt.toLocaleString()}억
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">전국 순위</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {diagnosis.comparisons.rank}/{diagnosis.comparisons.totalRegions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!diagnosis && !loading && !error && (
          <div className="border border-gray-800 border-dashed rounded-xl p-12 bg-gray-900/30 flex flex-col items-center gap-3 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <p className="text-gray-500 text-sm">
              위에서 지역을 선택하고 &quot;진단하기&quot; 버튼을 눌러주세요.
            </p>
            <p className="text-gray-600 text-xs">
              AI가 재정 데이터를 분석하여 건전성 등급과 정책 시뮬레이션을 제공합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
