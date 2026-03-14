'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  getSDGDomains,
  getDomainById,
  getMetroIndicatorData,
  getAllMetroNames,
  getDistrictNames,
  getDistrictIndicatorData,
  getDistrictSDGData,
  getNationalAverageForIndicator,
  calculateDomainProgress,
  calculateOverallProgress,
  calculateDistrictDomainProgress,
  calculateDistrictOverallProgress,
  calculateIndicatorProgress,
  getDomainRanking,
  getMetroQoLRanking,
  getDistrictQoLRanking,
  type MetroIndicatorData,
  type YearDataPoint,
  type QoLScore,
} from '@/lib/data/local-sdg-data';
import { useGoals } from '@/hooks/useGoals';
import { DataDownload } from '@/components/shared/DataDownload';

// ── 타입 & 상수 ─────────────────────────────────────────────

type ViewMode = 'overview' | 'domain' | 'compare' | 'editor' | 'qol';

const MODE_TABS: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'overview', label: '전체 현황', icon: '📊' },
  { key: 'domain', label: '영역 상세', icon: '🔍' },
  { key: 'compare', label: '지역 비교', icon: '⚖️' },
  { key: 'qol', label: '삶의 질 지수', icon: '🏆' },
  { key: 'editor', label: '목표 설정', icon: '✏️' },
];

// ── SVG 유틸 ────────────────────────────────────────────────

function ProgressRing({ progress, color, size = 72 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-border" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-sm font-mono font-bold text-foreground">{Math.round(progress)}%</span>
    </div>
  );
}

function SparkLine({ data, color, width = 80, height = 32 }: { data: YearDataPoint[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((d.value - minV) / range) * (height - 4);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function RadarChart({ domainScores, size = 300 }: { domainScores: { id: string; name: string; progress: number; color: string }[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const center = size / 2;
  const maxR = size / 2 - 40;
  const n = domainScores.length;
  const angles = domainScores.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const pt = (angle: number, fraction: number) => ({
    x: center + maxR * fraction * Math.cos(angle),
    y: center + maxR * fraction * Math.sin(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = rings.map(r => {
    const pts = angles.map(a => pt(a, r));
    return `M${pts.map(p => `${p.x},${p.y}`).join(' L')} Z`;
  });

  const dataPoints = domainScores.map((d, i) => pt(angles[i], d.progress / 100));
  const dataPath = `M${dataPoints.map(p => `${p.x},${p.y}`).join(' L')} Z`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto">
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" className="stroke-border" strokeWidth="0.5" strokeDasharray={i < 3 ? '3,3' : undefined} />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1);
        return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} className="stroke-border" strokeWidth="0.5" />;
      })}
      <path d={dataPath} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <g key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* 투명한 큰 히트 영역 */}
          <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
          {/* 실제 포인트 */}
          <circle cx={p.x} cy={p.y} r={hovered === i ? 6 : 4} fill={domainScores[i].color} className="stroke-background" strokeWidth="1.5"
            style={{ transition: 'r 0.15s ease' }} />
        </g>
      ))}
      {domainScores.map((d, i) => {
        const labelR = maxR + 22;
        const lx = center + labelR * Math.cos(angles[i]);
        const ly = center + labelR * Math.sin(angles[i]);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
            className="fill-muted-foreground" fontSize="11" fontWeight="500">
            {d.name}
          </text>
        );
      })}
      {rings.map((r, i) => (
        <text key={i} x={center + 4} y={center - maxR * r - 2} className="fill-muted-foreground" fontSize="9" fontFamily="monospace">
          {Math.round(r * 100)}
        </text>
      ))}
      {/* 호버 툴팁 */}
      {hovered !== null && (() => {
        const d = domainScores[hovered];
        const p = dataPoints[hovered];
        const label = `${d.name} ${Math.round(d.progress)}%`;
        const textW = label.length * 7.5 + 16;
        const tooltipH = 26;
        // 툴팁 위치: 포인트 위쪽, 화면 밖으로 나가지 않도록 조정
        let tx = p.x - textW / 2;
        let ty = p.y - tooltipH - 10;
        if (tx < 4) tx = 4;
        if (tx + textW > size - 4) tx = size - textW - 4;
        if (ty < 4) ty = p.y + 14;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={ty} width={textW} height={tooltipH} rx="4" fill="rgba(0,0,0,0.85)" />
            <text x={tx + textW / 2} y={ty + tooltipH / 2 + 1} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize="12" fontWeight="600" fontFamily="monospace">
              {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function IndicatorChart({ data, targetValue, nationalAvg, color, direction }: {
  data: YearDataPoint[]; targetValue: number; nationalAvg: number; color: string; direction: string;
}) {
  const W = 600, H = 260;
  const PAD = { top: 20, right: 30, bottom: 35, left: 55 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const allValues = [...values, targetValue, nationalAvg];
  const minY = Math.min(...allValues) * 0.9;
  const maxY = Math.max(...allValues) * 1.1;
  const rangeY = maxY - minY || 1;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - minY) / rangeY) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`).join(' ');
  const areaPath = linePath + ` L${xScale(data.length - 1)},${PAD.top + chartH} L${xScale(0)},${PAD.top + chartH} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => minY + (rangeY * i) / 4);
  const gradId = `grad-${data[0]?.year}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]" style={{ maxHeight: 260 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} className="stroke-border" strokeDasharray="4,4" strokeWidth="0.5" />
            <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" className="fill-muted-foreground" fontSize="11" fontFamily="monospace">
              {v >= 100 ? Math.round(v) : v.toFixed(1)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={i} x={xScale(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" fontSize="11" fontFamily="monospace">
            {d.year.toString().slice(2)}
          </text>
        ))}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <line x1={PAD.left} y1={yScale(targetValue)} x2={W - PAD.right} y2={yScale(targetValue)}
          stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6,4" />
        <text x={W - PAD.right + 4} y={yScale(targetValue) + 4} fill="#fbbf24" fontSize="10" fontFamily="monospace">목표</text>
        <line x1={PAD.left} y1={yScale(nationalAvg)} x2={W - PAD.right} y2={yScale(nationalAvg)}
          className="stroke-muted-foreground" strokeWidth="1" strokeDasharray="3,3" />
        <text x={W - PAD.right + 4} y={yScale(nationalAvg) + 4} className="fill-muted-foreground" fontSize="10" fontFamily="monospace">평균</text>
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(d.value)} r="4" fill={color} className="stroke-background" strokeWidth="1.5" />
            {(i === 0 || i === data.length - 1) && (
              <text x={xScale(i)} y={yScale(d.value) - 10} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" fontFamily="monospace">
                {d.value >= 100 ? Math.round(d.value) : d.value.toFixed(1)}
              </text>
            )}
          </g>
        ))}
        {data.length >= 2 && (() => {
          const last = data[data.length - 1].value;
          const prev = data[data.length - 2].value;
          const improving = direction === 'higher_better' ? last > prev : last < prev;
          const arrowColor = improving ? '#10b981' : '#ef4444';
          return (
            <text x={xScale(data.length - 1) + 14} y={yScale(last) + 4} fill={arrowColor} fontSize="14" fontWeight="bold">
              {improving ? '▲' : '▼'}
            </text>
          );
        })()}
      </svg>
    </div>
  );
}

// ── 섹션 헤더 ───────────────────────────────────────────────

function SectionHeader({ title, color = 'text-blue-400' }: { title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 border border-border px-3 py-2">
      <h2 className={`text-lg md:text-xl font-bold ${color}`}>{title}</h2>
    </div>
  );
}

// ── 메인 대시보드 ───────────────────────────────────────────

export function GoalsDashboard() {
  const [mode, setMode] = useState<ViewMode>('overview');
  const [selectedMetro, setSelectedMetro] = useState('서울특별시');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('finance');
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [compareMetros, setCompareMetros] = useState<string[]>(['서울특별시', '부산광역시']);
  const [compareDomainId, setCompareDomainId] = useState<string>('finance');
  const importRef = useRef<HTMLInputElement>(null);

  const { goals, setGoalTarget, getEffectiveTarget, resetGoal, resetAllGoals, exportGoals, importGoals } = useGoals();

  const domains = useMemo(() => getSDGDomains(), []);
  const metroNames = useMemo(() => getAllMetroNames(), []);
  const districtNames = useMemo(() => getDistrictNames(selectedMetro), [selectedMetro]);
  const isDistrictMode = selectedDistrict !== null;

  // 광역/자치구 통합 데이터 접근 헬퍼
  const getIndicatorDataFor = useCallback((indicatorId: string) => {
    if (isDistrictMode && selectedDistrict) {
      return getDistrictIndicatorData(selectedMetro, selectedDistrict, indicatorId);
    }
    return getMetroIndicatorData(selectedMetro, indicatorId);
  }, [selectedMetro, selectedDistrict, isDistrictMode]);

  const getDomainProgressFor = useCallback((domainId: string) => {
    if (isDistrictMode && selectedDistrict) {
      return calculateDistrictDomainProgress(selectedMetro, selectedDistrict, domainId, goals);
    }
    return calculateDomainProgress(selectedMetro, domainId, goals);
  }, [selectedMetro, selectedDistrict, isDistrictMode, goals]);

  const getOverallProgressFor = useCallback(() => {
    if (isDistrictMode && selectedDistrict) {
      return calculateDistrictOverallProgress(selectedMetro, selectedDistrict, goals);
    }
    return calculateOverallProgress(selectedMetro, goals);
  }, [selectedMetro, selectedDistrict, isDistrictMode, goals]);

  const domainScores = useMemo(() =>
    domains.map(d => ({
      id: d.id,
      name: d.name,
      progress: getDomainProgressFor(d.id),
      color: d.color,
    })),
    [domains, getDomainProgressFor]
  );

  const overallProgress = useMemo(() => getOverallProgressFor(), [getOverallProgressFor]);

  // 표시 이름
  const displayName = useMemo(() => {
    const short = selectedMetro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
    return selectedDistrict ? `${short} ${selectedDistrict}` : short;
  }, [selectedMetro, selectedDistrict]);

  const shortMetroName = useCallback((name: string) =>
    name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, ''),
    []
  );

  const toggleCompareMetro = useCallback((metro: string) => {
    setCompareMetros(prev => {
      if (prev.includes(metro)) return prev.filter(m => m !== metro);
      if (prev.length >= 4) return prev;
      return [...prev, metro];
    });
  }, []);

  const handleExport = useCallback(() => {
    const json = exportGoals();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `나라살림_목표설정_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportGoals]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      importGoals(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importGoals]);

  return (
    <div className="space-y-1 text-foreground">
      {/* ====== 타이틀 + 셀렉터 + 탭 ====== */}
      <div className="border border-border p-3 md:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              🎯 지역 목표 추적 <span className="text-blue-500">Local SDG Tracker</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">11개 삶의 질 영역 · 40개 지표 · 목표 vs 실적 비교</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-muted-foreground">광역시도</label>
            <select
              value={selectedMetro}
              onChange={e => { setSelectedMetro(e.target.value); setSelectedDistrict(null); }}
              className="bg-muted border border-border text-foreground rounded px-2 py-1.5 text-sm"
            >
              {metroNames.map(m => (
                <option key={m} value={m}>{shortMetroName(m)}</option>
              ))}
            </select>
            {districtNames.length > 0 && (
              <>
                <label className="text-sm text-muted-foreground">자치구</label>
                <select
                  value={selectedDistrict ?? ''}
                  onChange={e => setSelectedDistrict(e.target.value || null)}
                  className="bg-muted border border-border text-foreground rounded px-2 py-1.5 text-sm"
                >
                  <option value="">전체 (광역)</option>
                  {districtNames.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </>
            )}
            {isDistrictMode && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                🏘️ 자치구 모드
              </span>
            )}
          </div>
        </div>
        {/* 탭 */}
        <div className="flex flex-wrap gap-1">
          {MODE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                mode === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== MODE 1: 전체 현황 ====== */}
      {mode === 'overview' && (
        <div className="space-y-1">
          <SectionHeader title={`${displayName} 종합 현황`} color="text-blue-500" />

          {/* 자치구 모드 안내 배너 */}
          {isDistrictMode && (
            <div className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">
              <span className="font-bold text-blue-700 dark:text-blue-300">🏘️ {selectedDistrict}</span>
              <span className="text-blue-600 dark:text-blue-400 ml-2">
                재정 영역은 실제 자치구 데이터, 나머지 영역은 소속 광역 기반 추정치입니다.
              </span>
            </div>
          )}

          {/* 요약 */}
          <div className="border border-border p-4 flex flex-col md:flex-row items-center gap-6">
            <div className="text-center">
              <ProgressRing progress={overallProgress} color="#3b82f6" size={100} />
              <div className="text-sm text-muted-foreground mt-1">종합 달성률</div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
              {(() => {
                const sorted = [...domainScores].sort((a, b) => b.progress - a.progress);
                const best = sorted[0];
                const worst = sorted[sorted.length - 1];
                const above80 = sorted.filter(d => d.progress >= 80).length;
                return (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">최고 영역</div>
                      <div className="text-lg font-bold" style={{ color: best.color }}>{best.name}</div>
                      <div className="text-sm font-mono text-muted-foreground">{best.progress}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">최저 영역</div>
                      <div className="text-lg font-bold" style={{ color: worst.color }}>{worst.name}</div>
                      <div className="text-sm font-mono text-muted-foreground">{worst.progress}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">80%+ 달성</div>
                      <div className="text-lg font-bold text-emerald-500">{above80}</div>
                      <div className="text-sm text-muted-foreground">/ 11개 영역</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 레이더 차트 */}
          <div className="border border-border p-4">
            <RadarChart domainScores={domainScores} />
          </div>

          {/* 11개 영역 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {domains.map(domain => {
              const score = domainScores.find(s => s.id === domain.id);
              const progress = score?.progress ?? 0;
              const firstInd = domain.indicators[0];
              const firstData = getIndicatorDataFor(firstInd.id);
              return (
                <button
                  key={domain.id}
                  onClick={() => { setSelectedDomainId(domain.id); setMode('domain'); }}
                  className="border border-border p-3 text-left hover:border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  style={{ borderLeftWidth: 4, borderLeftColor: domain.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{domain.icon}</span>
                      <span className="text-base font-bold text-foreground">{domain.name}</span>
                    </div>
                    <ProgressRing progress={progress} color={domain.color} size={52} />
                  </div>
                  <div className="space-y-1">
                    {domain.indicators.slice(0, 2).map(ind => {
                      const d = getIndicatorDataFor(ind.id);
                      if (!d) return null;
                      return (
                        <div key={ind.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate mr-2">{ind.name}</span>
                          <span className="font-mono font-bold text-foreground">{d.currentValue}{ind.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                  {firstData && (
                    <div className="mt-2">
                      <SparkLine data={firstData.history} color={domain.color} height={28} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 다운로드 */}
          <div className="flex justify-end border border-border px-3 py-2">
            <DataDownload
              data={domainScores.map(d => ({
                영역: d.name,
                '달성률(%)': d.progress,
                지역: displayName,
              }))}
              filename={`목표달성현황_${displayName}`}
            />
          </div>
        </div>
      )}

      {/* ====== MODE 2: 영역 상세 ====== */}
      {mode === 'domain' && (
        <div className="space-y-1">
          <div className="border border-border p-3 flex flex-wrap gap-1.5">
            {domains.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDomainId(d.id); setExpandedIndicator(null); }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer border ${
                  selectedDomainId === d.id ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{
                  backgroundColor: selectedDomainId === d.id ? d.color : undefined,
                  borderColor: selectedDomainId === d.id ? d.color : 'var(--border)',
                }}
              >
                {d.icon} {d.name}
              </button>
            ))}
          </div>

          {isDistrictMode && (
            <div className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-2 text-xs text-blue-600 dark:text-blue-400">
              🏘️ <span className="font-bold">{selectedDistrict}</span> 자치구 데이터 표시 중
              {selectedDomainId !== 'finance' && ' (소속 광역 기반 추정치)'}
            </div>
          )}

          {(() => {
            const domain = getDomainById(selectedDomainId);
            if (!domain) return null;
            const domProgress = getDomainProgressFor(domain.id);
            const ranking = getDomainRanking(domain.id, goals, 3);

            return (
              <div className="space-y-1">
                <div className="border border-border p-4 flex flex-col md:flex-row items-start md:items-center gap-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: domain.color }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{domain.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{domain.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {domain.indicators.length}개 지표 · {displayName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <ProgressRing progress={domProgress} color={domain.color} size={80} />
                    {!isDistrictMode && (
                      <div className="text-sm space-y-1">
                        <div className="text-muted-foreground">🏆 {ranking.top.map(r => shortMetroName(r.metro)).join(', ')}</div>
                        <div className="text-muted-foreground/70">⚠️ {ranking.bottom.map(r => shortMetroName(r.metro)).join(', ')}</div>
                      </div>
                    )}
                  </div>
                </div>

                {domain.indicators.map(indicator => {
                  const data = getIndicatorDataFor(indicator.id);
                  if (!data) return null;
                  const target = isDistrictMode && selectedDistrict
                    ? getEffectiveTarget(indicator.id, selectedMetro, data.targetValue, selectedDistrict)
                    : getEffectiveTarget(indicator.id, selectedMetro, data.targetValue);
                  const natAvg = getNationalAverageForIndicator(indicator.id);
                  const progress = calculateIndicatorProgress(data.currentValue, target, indicator.direction);
                  const isExpanded = expandedIndicator === indicator.id;

                  return (
                    <div key={indicator.id} className="border border-border">
                      <button
                        onClick={() => setExpandedIndicator(isExpanded ? null : indicator.id)}
                        className="w-full p-3 flex flex-col md:flex-row md:items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{indicator.name}</span>
                            <span className="text-xs text-muted-foreground/70">{indicator.unit}</span>
                            <span className="text-xs" title={indicator.direction === 'higher_better' ? '높을수록 좋음' : '낮을수록 좋음'}>
                              {indicator.direction === 'higher_better' ? '📈' : '📉'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{indicator.description}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold" style={{ color: domain.color }}>
                              {data.currentValue}{indicator.unit === '%' || indicator.unit === '세' || indicator.unit === '명' || indicator.unit === '배' ? '' : ' '}{indicator.unit !== '%' && indicator.unit !== '세' && indicator.unit !== '명' && indicator.unit !== '배' ? indicator.unit : indicator.unit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              목표 {target}{indicator.unit} · 평균 {natAvg}{indicator.unit}
                            </div>
                          </div>
                          <div className="w-24">
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: domain.color }} />
                            </div>
                            <div className="text-xs font-mono text-muted-foreground text-right mt-0.5">{Math.round(progress)}%</div>
                          </div>
                          <span className="text-muted-foreground text-sm">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border p-3 md:p-4 bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-2">
                            2018~2025년 추이 | <span style={{ color: domain.color }}>■ 실적</span> · <span className="text-yellow-500">--- 목표</span> · <span className="text-muted-foreground">--- 전국평균</span>
                          </div>
                          <IndicatorChart
                            data={data.history}
                            targetValue={target}
                            nationalAvg={natAvg}
                            color={domain.color}
                            direction={indicator.direction}
                          />
                          <div className="mt-2 text-xs text-muted-foreground/70">출처: {indicator.source}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== MODE 3: 지역 비교 ====== */}
      {mode === 'compare' && (
        <div className="space-y-1">
          <SectionHeader title="지역 비교" color="text-purple-500" />

          <div className="border border-border p-3 space-y-2">
            <div className="text-sm text-muted-foreground">비교할 광역시도 선택 (최대 4개)</div>
            <div className="flex flex-wrap gap-1.5">
              {metroNames.map(m => (
                <button
                  key={m}
                  onClick={() => toggleCompareMetro(m)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    compareMetros.includes(m)
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {shortMetroName(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border p-3 flex flex-wrap gap-1.5">
            {domains.map(d => (
              <button
                key={d.id}
                onClick={() => setCompareDomainId(d.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  compareDomainId === d.id ? 'text-white' : 'text-muted-foreground'
                }`}
                style={{
                  backgroundColor: compareDomainId === d.id ? d.color : undefined,
                }}
              >
                {d.icon} {d.name}
              </button>
            ))}
          </div>

          {(() => {
            const domain = getDomainById(compareDomainId);
            if (!domain) return null;
            const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
            return (
              <div className="space-y-1">
                {domain.indicators.map(indicator => {
                  const natAvg = getNationalAverageForIndicator(indicator.id);
                  const metroDataItems = compareMetros.map(metro => getMetroIndicatorData(metro, indicator.id)).filter(Boolean) as MetroIndicatorData[];

                  return (
                    <div key={indicator.id} className="border border-border p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-foreground">{indicator.name}</span>
                        <span className="text-xs text-muted-foreground/70">{indicator.unit}</span>
                        <span className="text-xs text-muted-foreground ml-auto">전국평균: {natAvg}{indicator.unit}</span>
                      </div>
                      {(() => {
                        if (metroDataItems.length === 0) return null;
                        const W2 = 600, H2 = 220;
                        const PAD2 = { top: 15, right: 30, bottom: 30, left: 55 };
                        const cW = W2 - PAD2.left - PAD2.right;
                        const cH = H2 - PAD2.top - PAD2.bottom;
                        const allVals = metroDataItems.flatMap(d => d.history.map(h => h.value));
                        allVals.push(natAvg);
                        const minV = Math.min(...allVals) * 0.9;
                        const maxV = Math.max(...allVals) * 1.1;
                        const rV = maxV - minV || 1;
                        const years = metroDataItems[0].history;
                        const xS = (i: number) => PAD2.left + (i / (years.length - 1)) * cW;
                        const yS = (v: number) => PAD2.top + cH - ((v - minV) / rV) * cH;

                        return (
                          <div className="overflow-x-auto">
                            <svg viewBox={`0 0 ${W2} ${H2}`} className="w-full min-w-[400px]" style={{ maxHeight: 220 }}>
                              {Array.from({ length: 4 }, (_, i) => minV + (rV * i) / 3).map((v, i) => (
                                <g key={i}>
                                  <line x1={PAD2.left} y1={yS(v)} x2={W2 - PAD2.right} y2={yS(v)} className="stroke-border" strokeDasharray="3,3" strokeWidth="0.5" />
                                  <text x={PAD2.left - 8} y={yS(v) + 4} textAnchor="end" className="fill-muted-foreground" fontSize="10" fontFamily="monospace">
                                    {v >= 100 ? Math.round(v) : v.toFixed(1)}
                                  </text>
                                </g>
                              ))}
                              {years.map((d, i) => (
                                <text key={i} x={xS(i)} y={H2 - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="10" fontFamily="monospace">
                                  {d.year.toString().slice(2)}
                                </text>
                              ))}
                              <line x1={PAD2.left} y1={yS(natAvg)} x2={W2 - PAD2.right} y2={yS(natAvg)} className="stroke-muted-foreground" strokeWidth="1" strokeDasharray="3,3" />
                              {metroDataItems.map((md, mi) => {
                                const c = COLORS[mi % COLORS.length];
                                const path = md.history.map((h, i) => `${i === 0 ? 'M' : 'L'}${xS(i)},${yS(h.value)}`).join(' ');
                                return (
                                  <g key={md.metroName}>
                                    <path d={path} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" />
                                    {md.history.map((h, i) => (
                                      <circle key={i} cx={xS(i)} cy={yS(h.value)} r="3" fill={c} className="stroke-background" strokeWidth="1" />
                                    ))}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {compareMetros.map((m, i) => (
                          <div key={m} className="flex items-center gap-1.5">
                            <span className="w-3 h-1 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-muted-foreground">{shortMetroName(m)}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-px bg-muted-foreground rounded" />
                          <span className="text-xs text-muted-foreground">전국평균</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== MODE 4: 목표 설정 (4열 그리드) ====== */}
      {mode === 'editor' && (
        <div className="space-y-1">
          <SectionHeader title="목표 설정" color="text-amber-500" />

          {/* 설명 + 액션 */}
          <div className="border border-border p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{displayName}</span>의 각 지표에 대해 커스텀 목표값을 설정할 수 있습니다.
                설정된 목표는 브라우저에 저장되며, JSON으로 내보내기/가져오기가 가능합니다.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                수정된 목표: {goals.filter(g =>
                  g.metroName === selectedMetro &&
                  (isDistrictMode ? g.districtName === selectedDistrict : !g.districtName)
                ).length}개
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleExport}
                className="px-3 py-1.5 bg-muted text-foreground rounded text-xs hover:bg-muted/80 transition-colors cursor-pointer border border-border">
                📤 내보내기
              </button>
              <button onClick={() => importRef.current?.click()}
                className="px-3 py-1.5 bg-muted text-foreground rounded text-xs hover:bg-muted/80 transition-colors cursor-pointer border border-border">
                📥 가져오기
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              <button onClick={resetAllGoals}
                className="px-3 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900 transition-colors cursor-pointer border border-red-200 dark:border-red-800">
                🗑️ 전체 초기화
              </button>
            </div>
          </div>

          {isDistrictMode && (
            <div className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 p-2 text-xs text-blue-600 dark:text-blue-400">
              🏘️ <span className="font-bold">{selectedDistrict}</span> 자치구 목표 편집 중
            </div>
          )}

          {/* 4열 그리드 (11개 영역 = 3행 × 4열, 마지막 행 3개) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {domains.map(domain => (
              <div key={domain.id} className="border border-border rounded-lg overflow-hidden"
                style={{ borderTopWidth: 3, borderTopColor: domain.color }}>
                {/* 영역 헤더 */}
                <div className="px-3 py-2 bg-muted/40 flex items-center gap-2">
                  <span className="text-lg">{domain.icon}</span>
                  <span className="text-sm font-bold text-foreground">{domain.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{domain.indicators.length}개</span>
                </div>
                {/* 지표 목록 */}
                <div className="p-2 space-y-2">
                  {domain.indicators.map(indicator => {
                    const data = getIndicatorDataFor(indicator.id);
                    if (!data) return null;
                    const effectiveTarget = isDistrictMode && selectedDistrict
                      ? getEffectiveTarget(indicator.id, selectedMetro, data.targetValue, selectedDistrict)
                      : getEffectiveTarget(indicator.id, selectedMetro, data.targetValue);
                    const isCustom = goals.some(g =>
                      g.indicatorId === indicator.id &&
                      g.metroName === selectedMetro &&
                      (isDistrictMode ? g.districtName === selectedDistrict : !g.districtName)
                    );

                    return (
                      <div key={indicator.id} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground truncate">{indicator.name}</span>
                          {isCustom && (
                            <button
                              onClick={() => resetGoal(indicator.id, selectedMetro, isDistrictMode ? selectedDistrict ?? undefined : undefined)}
                              className="text-xs text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0"
                              title="기본값으로 복원"
                            >
                              ↩️
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          현재: <span className="font-mono font-bold text-foreground">{data.currentValue}</span>{indicator.unit}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground shrink-0">목표</span>
                          <input
                            type="number"
                            value={effectiveTarget}
                            onChange={e => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v)) {
                                setGoalTarget(
                                  indicator.id,
                                  selectedMetro,
                                  v,
                                  isDistrictMode ? selectedDistrict ?? undefined : undefined
                                );
                              }
                            }}
                            step={indicator.unit === '명' && indicator.id === 'dem_fertility' ? 0.01 : indicator.unit === '%' ? 0.1 : 1}
                            className={`flex-1 min-w-0 bg-muted border text-foreground rounded px-1.5 py-0.5 text-xs font-mono text-right ${
                              isCustom ? 'border-amber-400 dark:border-amber-600' : 'border-border'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground shrink-0">{indicator.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== MODE 5: 삶의 질 지수 ====== */}
      {mode === 'qol' && (() => {
        const metroRanking = getMetroQoLRanking(goals);
        const districtRanking = getDistrictQoLRanking(selectedMetro, goals);
        const currentMetroScore = metroRanking.find(r => r.name === selectedMetro);
        const currentDistrictScore = isDistrictMode && selectedDistrict
          ? districtRanking.find(r => r.name === selectedDistrict) : null;
        const displayScore = currentDistrictScore ?? currentMetroScore;

        return (
          <div className="space-y-1">
            <SectionHeader title="삶의 질 지수" color="text-emerald-500" />

            {/* 현재 선택 지역 점수 + 17개 광역시도 랭킹 테이블 (사이드바이사이드) */}
            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-1">
              {/* 좌측: 현재 지역 점수 + 영역별 달성률 */}
              {displayScore && (
                <div className="border border-border p-4 md:p-5">
                  <div className="flex flex-col items-center mb-5">
                    <ProgressRing progress={displayScore.score} color="#10b981" size={140} />
                    <div className="text-lg font-bold text-foreground mt-3">{displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentDistrictScore
                        ? `자치구 내 ${currentDistrictScore.rank}위 / ${districtRanking.length}개`
                        : `전국 ${displayScore.rank}위 / 17개 광역시도`}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-foreground mb-3">영역별 달성률</div>
                  <div className="space-y-2">
                    {displayScore.domainScores
                      .sort((a, b) => b.score - a.score)
                      .map(ds => (
                        <div key={ds.domainId} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-16 shrink-0 truncate">{ds.domainName}</span>
                          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(ds.score, 100)}%`, backgroundColor: ds.color }} />
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground w-10 text-right">{ds.score}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 우측: 17개 광역시도 삶의 질 지수 순위 테이블 */}
              <div className="border border-border">
                <div className="px-3 py-2 bg-muted/40 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">🏆 17개 광역시도 삶의 질 지수 순위</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground w-10">순위</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">광역시도</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground w-14">점수</th>
                        {domains.map(d => (
                          <th key={d.id} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground hidden md:table-cell" title={d.name}>
                            {d.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metroRanking.map(r => {
                        const isSelected = r.name === selectedMetro;
                        return (
                          <tr key={r.name}
                            onClick={() => { setSelectedMetro(r.name); setSelectedDistrict(null); }}
                            className={`border-b border-border cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-2 py-1.5">
                              <span className={`font-mono font-bold text-sm ${r.rank <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                              </span>
                            </td>
                            <td className="px-2 py-1.5">
                              <span className={`text-sm font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                                {shortMetroName(r.name)}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className={`font-mono font-bold ${r.score >= 80 ? 'text-emerald-500' : r.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                {r.score}
                              </span>
                            </td>
                            {domains.map(d => {
                              const ds = r.domainScores.find(s => s.domainId === d.id);
                              return (
                                <td key={d.id} className="px-1 py-1.5 text-center hidden md:table-cell">
                                  <span className={`text-xs font-mono font-bold ${(ds?.score ?? 0) >= 85 ? 'text-emerald-500' : (ds?.score ?? 0) >= 75 ? 'text-foreground' : 'text-amber-500'}`}>{ds?.score ?? '-'}</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 자치구 랭킹 */}
            {districtRanking.length > 0 && (
              <div className="border border-border">
                <div className="px-3 py-2 bg-muted/40 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    🏘️ {shortMetroName(selectedMetro)} 시군구별 삶의 질 지수 ({districtRanking.length}개)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b border-border bg-muted/20">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-12">순위</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">자치구</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-20">점수</th>
                        {domains.map(d => (
                          <th key={d.id} className="px-1.5 py-2 text-center text-xs font-medium text-muted-foreground hidden md:table-cell" title={d.name}>
                            {d.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {districtRanking.map(r => {
                        const isSelected = isDistrictMode && r.name === selectedDistrict;
                        return (
                          <tr key={r.name}
                            onClick={() => setSelectedDistrict(r.name)}
                            className={`border-b border-border cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-3 py-1.5">
                              <span className={`font-mono text-xs font-bold ${r.rank <= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <span className={`text-xs font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                                {r.name}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <span className={`font-mono font-bold text-xs ${r.score >= 80 ? 'text-emerald-500' : r.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                {r.score}
                              </span>
                            </td>
                            {domains.map(d => {
                              const ds = r.domainScores.find(s => s.domainId === d.id);
                              return (
                                <td key={d.id} className="px-1.5 py-1.5 text-center hidden md:table-cell">
                                  <span className={`text-xs font-mono font-bold ${(ds?.score ?? 0) >= 85 ? 'text-emerald-500' : (ds?.score ?? 0) >= 75 ? 'text-foreground' : 'text-amber-500'}`}>{ds?.score ?? '-'}</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 다운로드 */}
            <div className="flex justify-end border border-border px-3 py-2">
              <DataDownload
                data={[
                  ...metroRanking.map(r => ({
                    순위: r.rank,
                    지역: r.name,
                    '삶의질지수': r.score,
                    구분: '광역시도',
                    ...Object.fromEntries(r.domainScores.map(ds => [ds.domainName, ds.score])),
                  })),
                  ...districtRanking.map(r => ({
                    순위: r.rank,
                    지역: `${shortMetroName(selectedMetro)} ${r.name}`,
                    '삶의질지수': r.score,
                    구분: '시군구',
                    ...Object.fromEntries(r.domainScores.map(ds => [ds.domainName, ds.score])),
                  })),
                ]}
                filename={`삶의질지수_${shortMetroName(selectedMetro)}`}
              />
            </div>
          </div>
        );
      })()}

      {/* ====== 데이터 출처 ====== */}
      <div className="border border-border p-3 text-center">
        <p className="text-xs text-muted-foreground">
          데이터 출처: KOSIS 국가통계포털(2024), e-나라지표(2024), 지역재정365(2025 당초예산), 행정안전부(2024), 통계청(2024), 환경부(2023), 교육부(2024), 보건복지부(2024), 국토교통부(2024)
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          ※ 일부 수치는 공개 통계 기반 추정치이며, 실제 공식 발표값과 차이가 있을 수 있습니다. 지표별 기준연도가 상이할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
