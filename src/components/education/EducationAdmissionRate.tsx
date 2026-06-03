'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import {
  ADMISSION_SIDO, ADMISSION_YEARS, ADMISSION_LATEST_YEAR, ADMISSION_NATIONAL_LATEST,
} from '@/lib/data/admission-rate';

interface SggRow { sido: string; sgg: string; rate: number; grads: number }

export function EducationAdmissionRate() {
  const [sggData, setSggData] = useState<SggRow[] | null>(null);
  const [sggSido, setSggSido] = useState('전체');
  const [loading, setLoading] = useState(false);

  const bar = ADMISSION_SIDO.map((s) => ({ name: s.sido, rate: s.latest }));
  const top = ADMISSION_SIDO[0];
  const bottom = ADMISSION_SIDO[ADMISSION_SIDO.length - 1];

  // 연도 추이 (전국 주요 시도 라인)
  const trend = useMemo(() => {
    return ADMISSION_YEARS.map((y) => {
      const row: Record<string, number | string> = { year: y };
      for (const s of ADMISSION_SIDO) {
        const pt = s.series.find((p) => p.year === y);
        row[s.sido] = pt?.rate ?? 0;
      }
      return row;
    });
  }, []);

  const sggList = useMemo(() => {
    if (!sggData) return [];
    const filtered = sggSido === '전체' ? sggData : sggData.filter((r) => r.sido === sggSido);
    return filtered;
  }, [sggData, sggSido]);

  async function loadSgg() {
    if (sggData) return;
    setLoading(true);
    try {
      const res = await fetch(`/data/admission-sgg-${ADMISSION_LATEST_YEAR}.json`);
      const j = await res.json();
      setSggData(j.list ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">대학 진학률 (시도·시군구별)</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          고등학교 졸업자의 대학 진학률을 시도·시군구별로 비교합니다. {ADMISSION_LATEST_YEAR}년 전국 평균{' '}
          <strong className="text-gray-200">{ADMISSION_NATIONAL_LATEST}%</strong>.
          <span className="text-gray-500"> (출처: 한국교육개발원 교육통계 · 공공데이터포털 15053808)</span>
        </p>
      </div>

      {/* 해석 주의 */}
      <div className="border border-blue-900/40 bg-blue-950/20 rounded-lg p-3 text-sm text-blue-200/90">
        🔎 <strong className="text-blue-300">{bottom.sido} {bottom.latest}%</strong>(최저) vs{' '}
        <strong className="text-blue-300">{top.sido} {top.latest}%</strong>(최고).
        진학률이 낮다고 교육 수준이 낮은 건 아닙니다 — 수도권(특히 서울)은 <strong>재수·N수 선택</strong>이 많아
        당해 연도 진학률이 구조적으로 낮게 나타납니다.
      </div>

      {/* 시도별 순위 막대 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">시도별 진학률 ({ADMISSION_LATEST_YEAR})</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={bar} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" domain={[50, 90]} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#d1d5db', fontSize: 12 }} width={40} />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#e5e7eb' }}
              formatter={(v) => [`${v}%`, '진학률']} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {bar.map((d, i) => <Cell key={i} fill={d.rate < 70 ? '#ef4444' : d.rate >= 80 ? '#10b981' : '#3b82f6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 연도 추이 (최고·최저·전국 대표 시도) */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">연도별 추이 ({ADMISSION_YEARS[0]}~{ADMISSION_LATEST_YEAR})</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis domain={[55, 90]} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb' }} itemStyle={{ color: '#e5e7eb' }} formatter={(v) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={top.sido} stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="서울" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="경기" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* 시군구별 드릴다운 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-300">시군구별 진학률</h3>
          {!sggData ? (
            <button onClick={loadSgg} disabled={loading}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">
              {loading ? '불러오는 중…' : '시군구 데이터 보기'}
            </button>
          ) : (
            <select value={sggSido} onChange={(e) => setSggSido(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5">
              {['전체', ...ADMISSION_SIDO.map((s) => s.sido)].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
        {sggData && (
          <div className="border border-amber-900/40 bg-amber-950/20 rounded-lg p-3 mb-3 text-[13px] text-amber-100/90 leading-relaxed">
            <strong className="text-amber-300">왜 강남·서초가 진학률 하위일까?</strong> — 교육 수준이 낮아서가 <em>아닙니다</em>.
            진학률은 <strong>“졸업한 해에 대학에 등록한 비율”</strong>이라, 다음 요인으로 상위권 지향 지역일수록 낮게 나옵니다:
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-amber-100/80">
              <li><strong>재수·N수(주원인):</strong> 상위권 대학·의약학을 목표로, 원하는 곳에 못 가면 하위권 등록 대신 재수를 선택 → 당해 연도 ‘미진학’으로 집계.</li>
              <li><strong>조기유학·해외대학(부차):</strong> 해외 진학은 국내 대학 등록 통계에 잡히지 않아 진학률을 일부 낮춤.</li>
              <li><strong>역설:</strong> 재수 후 최종 진학까지 합치면 격차는 크게 줄어듭니다. 낮은 당해 진학률 = ‘눈높이가 높아 즉시 진학을 미룬 것’.</li>
            </ul>
            <span className="text-amber-200/60">※ 이 통계는 졸업 직후 시점만 반영(한국교육개발원 기준). 재수생 최종 진학은 미포함.</span>
          </div>
        )}
        {sggData && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-2">시도</th>
                  <th className="text-left py-2 px-2">시군구</th>
                  <th className="text-right py-2 px-2">졸업자</th>
                  <th className="text-right py-2 px-2">진학률</th>
                </tr>
              </thead>
              <tbody>
                {sggList.slice(0, 300).map((r, i) => (
                  <tr key={i} className="border-b border-gray-800/40">
                    <td className="py-1.5 px-2 text-gray-400">{r.sido}</td>
                    <td className="py-1.5 px-2 text-gray-200">{r.sgg}</td>
                    <td className="text-right py-1.5 px-2 text-gray-400">{r.grads.toLocaleString()}명</td>
                    <td className="text-right py-1.5 px-2 text-gray-100 font-semibold">{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
