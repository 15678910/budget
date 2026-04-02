'use client';

import { useCallback, useState } from 'react';

interface BenchmarkCity {
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
}

interface BenchmarkRecommendation {
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
}

interface BenchmarkData {
  matchingCities: BenchmarkCity[];
  recommendations: BenchmarkRecommendation[];
}

interface GlobalBenchmarkProps {
  regionType: string;
  regionName: string;
  onSelectPolicy: (policyName: string) => void;
}

export function GlobalBenchmark({ regionType, regionName, onSelectPolicy }: GlobalBenchmarkProps) {
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [activeCityDetail, setActiveCityDetail] = useState<string | null>(null);

  const handleFetchBenchmark = useCallback(async () => {
    setBenchmarkLoading(true);
    try {
      const res = await fetch(`/api/chat/diagnosis/recommend?regionType=${regionType}&regionName=${encodeURIComponent(regionName)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBenchmarkData(data);
    } catch {
      setBenchmarkData(null);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [regionType, regionName]);

  return (
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
                          onSelectPolicy(rec.policyName);
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
  );
}
