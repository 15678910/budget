'use client';

import { useMemo, useState } from 'react';
import {
  METRO_SCHOOL_AGG, DISTRICT_SCHOOL_AGG, SCHOOL_BUDGET_YEAR, SCHOOL_TOTAL_COUNT,
  type DistrictAgg,
} from '@/lib/data/education-districts';
import { METRO_EDUCATION_BUDGETS, computeDistribution, formatKRW } from '@/lib/data/education-budget';

interface SchoolRow { n: string; k: string; b: number; s: number; p: number }

const SIDO_LIST = METRO_SCHOOL_AGG.map((m) => m.sido);

export function EducationDistrictExplorer() {
  const [sido, setSido] = useState<string>(SIDO_LIST[0] ?? '서울');
  const [openDist, setOpenDist] = useState<string | null>(null);
  const [schoolsByDist, setSchoolsByDist] = useState<Record<string, SchoolRow[]>>({});
  const [loading, setLoading] = useState(false);

  // 전국 교육지원청 1인당 예산 분포 (도농 격차)
  const allDist = DISTRICT_SCHOOL_AGG;
  const distStats = useMemo(() => computeDistribution(allDist.map((d) => d.perStudent)), [allDist]);
  const top = allDist[0];
  const bottom = allDist[allDist.length - 1];

  // 선택 시도의 교육지원청
  const sidoDistricts = useMemo(
    () => allDist.filter((d) => d.sido === sido).sort((a, b) => b.perStudent - a.perStudent),
    [allDist, sido],
  );

  // 계층 정합성: 학교회계 세출 합 vs 시도 총예산(eduinfo)
  const coherence = useMemo(() => {
    return METRO_SCHOOL_AGG.map((m) => {
      const total = METRO_EDUCATION_BUDGETS.find((e) => e.name === m.name);
      const totalWon = total ? total.budget2026 * 1e12 : 0;
      return {
        name: m.name,
        schoolBudget: m.schoolBudget,
        totalBudget: totalWon,
        ratio: totalWon > 0 ? (m.schoolBudget / totalWon) * 100 : 0,
      };
    }).sort((a, b) => b.ratio - a.ratio);
  }, []);

  async function toggleDistrict(d: DistrictAgg) {
    if (openDist === d.code) { setOpenDist(null); return; }
    setOpenDist(d.code);
    if (!schoolsByDist[d.code]) {
      setLoading(true);
      try {
        const res = await fetch(`/data/education-schools-${SCHOOL_BUDGET_YEAR}.json`);
        const json = await res.json();
        setSchoolsByDist(json.byDistrict ?? {});
      } catch {
        // 무시 — 빈 목록 표시
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">교육지원청·학교별 분석</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          전국 <strong className="text-gray-200">{allDist.length}개 교육지원청</strong>과{' '}
          <strong className="text-gray-200">{SCHOOL_TOTAL_COUNT.toLocaleString()}개 학교</strong>의{' '}
          학교회계 세출({SCHOOL_BUDGET_YEAR})을 학생 1인당 기준으로 비교합니다.
          <span className="text-gray-500"> (출처: 학교알리미 OpenAPI · 학교회계 세출, 인건비 등 교육청 직접집행분 제외)</span>
        </p>
      </div>

      {/* 도농 격차 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
          <div className="text-xs text-gray-400">교육지원청 수</div>
          <div className="text-xl font-bold text-gray-100 mt-1">{allDist.length}곳</div>
        </div>
        <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
          <div className="text-xs text-gray-400">최고 1인당 (농어촌)</div>
          <div className="text-lg font-bold text-red-400 mt-1">{formatKRW(top.perStudent)}</div>
          <div className="text-[11px] text-gray-500">{top.name}</div>
        </div>
        <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
          <div className="text-xs text-gray-400">최저 1인당 (도시)</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{formatKRW(bottom.perStudent)}</div>
          <div className="text-[11px] text-gray-500">{bottom.name}</div>
        </div>
        <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
          <div className="text-xs text-gray-400">도농 격차</div>
          <div className="text-xl font-bold text-gray-100 mt-1">{distStats.spread.toFixed(1)}배</div>
          <div className="text-[11px] text-gray-500">지니 {distStats.gini.toFixed(3)}</div>
        </div>
      </div>

      {/* 계층 회계 정합성 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5">
        <h3 className="text-base font-semibold text-gray-200 mb-1">계층 정합성 — 학교회계가 시도 총예산에서 차지하는 비중</h3>
        <p className="text-xs text-gray-500 mb-3">
          학교회계 세출(학교가 직접 집행) ÷ 시도교육청 총예산. 나머지는 대부분 교원 인건비·교육청 직접사업으로,
          학교로 직접 내려가는 예산이 의외로 작다는 것을 보여줍니다.
        </p>
        <div className="space-y-1.5">
          {coherence.map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-sm">
              <span className="w-28 md:w-36 shrink-0 text-gray-300 truncate">{c.name}</span>
              <div className="flex-1 bg-gray-800 rounded h-4 relative overflow-hidden">
                <div className="bg-blue-600 h-full rounded" style={{ width: `${Math.min(100, c.ratio * 4)}%` }} />
              </div>
              <span className="w-12 text-right text-gray-200 font-semibold">{c.ratio.toFixed(1)}%</span>
              <span className="w-32 text-right text-gray-500 text-xs hidden md:inline">
                {(c.schoolBudget / 1e12).toFixed(2)}조 / {(c.totalBudget / 1e12).toFixed(1)}조
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-2">※ 막대 길이는 비율×4 배율로 시각화(대부분 8~20% 구간).</p>
      </section>

      {/* 시도 선택 → 교육지원청 → 학교 드릴다운 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h3 className="text-base font-semibold text-gray-200">시도 → 교육지원청 → 학교 드릴다운</h3>
          <select
            value={sido}
            onChange={(e) => { setSido(e.target.value); setOpenDist(null); }}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5"
          >
            {SIDO_LIST.map((s) => (
              <option key={s} value={s}>{METRO_SCHOOL_AGG.find((m) => m.sido === s)?.name ?? s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          {sidoDistricts.map((d) => {
            const isOpen = openDist === d.code;
            const schools = schoolsByDist[d.code] ?? [];
            return (
              <div key={d.code} className="border border-gray-800 rounded">
                <button
                  onClick={() => toggleDistrict(d)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800/50 transition-colors text-left"
                >
                  <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                  <span className="flex-1 text-gray-200 text-sm">{d.name}</span>
                  <span className="text-xs text-gray-500">{d.schoolCount}교</span>
                  <span className="text-sm font-semibold text-gray-100 w-24 text-right">{formatKRW(d.perStudent)}</span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 border-t border-gray-800/50">
                    {loading && schools.length === 0 ? (
                      <div className="py-3 text-sm text-gray-500">학교 데이터 불러오는 중…</div>
                    ) : schools.length === 0 ? (
                      <div className="py-3 text-sm text-gray-500">학교 데이터가 없습니다.</div>
                    ) : (
                      <div className="overflow-x-auto mt-2">
                        <table className="w-full text-xs md:text-sm">
                          <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                              <th className="text-left py-1.5 px-2">학교</th>
                              <th className="text-center py-1.5 px-2">구분</th>
                              <th className="text-right py-1.5 px-2">학교회계 세출</th>
                              <th className="text-right py-1.5 px-2">학생수</th>
                              <th className="text-right py-1.5 px-2">1인당</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schools.map((s, i) => (
                              <tr key={i} className="border-b border-gray-800/40">
                                <td className="py-1.5 px-2 text-gray-200">{s.n}</td>
                                <td className="text-center py-1.5 px-2 text-gray-400">{s.k}</td>
                                <td className="text-right py-1.5 px-2 text-gray-300">{formatKRW(s.b)}</td>
                                <td className="text-right py-1.5 px-2 text-gray-400">{s.s.toLocaleString()}명</td>
                                <td className="text-right py-1.5 px-2 text-gray-100 font-medium">{formatKRW(s.p)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
