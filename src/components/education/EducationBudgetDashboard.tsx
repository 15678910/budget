'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  METRO_EDUCATION_BUDGETS,
  perStudentBudget,
  computeDistribution, detectOutliers, rankByPerStudent,
  nationalSummary, aggregateByRegion, formatKRW,
} from '@/lib/data/education-budget';

const REGION_COLOR: Record<string, string> = {
  수도권: '#3b82f6',
  충청권: '#10b981',
  호남권: '#f59e0b',
  영남권: '#ef4444',
  강원제주: '#8b5cf6',
};

// 산점도 커스텀 툴팁 — 시도명 + 권역 + 값 항상 표시
function ScatterTip({ active, payload }: {
  active?: boolean;
  payload?: { payload: { name: string; region: string; students: number; perStudent: number; budget: number } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-[13px] shadow-xl">
      <div className="flex items-center gap-1.5 font-bold text-gray-100 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: REGION_COLOR[d.region] ?? '#6b7280' }} />
        {d.name} <span className="text-gray-500 font-normal">· {d.region}</span>
      </div>
      <div className="text-gray-300">학생수: {d.students.toLocaleString()}만명</div>
      <div className="text-gray-300">1인당 예산: {d.perStudent.toLocaleString()}만원</div>
      <div className="text-gray-300">총예산: {d.budget.toFixed(1)}조원</div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
      <div className="text-xs md:text-sm text-gray-400">{label}</div>
      <div className="text-xl md:text-2xl font-bold text-gray-100 mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function EducationBudgetDashboard() {
  const offices = METRO_EDUCATION_BUDGETS;

  const summary = useMemo(() => nationalSummary(offices), [offices]);
  const ranked = useMemo(() => rankByPerStudent(offices), [offices]);
  const dist = useMemo(() => computeDistribution(offices.map(perStudentBudget)), [offices]);
  const outliers = useMemo(() => detectOutliers(offices, 1.5), [offices]);
  const regions = useMemo(() => aggregateByRegion(offices), [offices]);

  const barData = ranked.map((r) => ({
    name: r.office.metro, // 정식 시도명 (예: 경상북도)
    fullName: r.office.name,
    perStudent: Math.round(r.perStudent / 1e4), // 만원
    region: r.office.region,
    vsAvg: r.vsAvgPct,
  }));

  const scatterData = offices.map((o) => ({
    name: o.metro, // 정식 시도명
    students: Math.round(o.students / 10000), // 만명
    perStudent: Math.round(perStudentBudget(o) / 1e4), // 만원
    budget: o.budget2026,
    region: o.region,
  }));

  // 정합성 해설 (자동 생성)
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const equityVerdict =
    dist.gini < 0.1 ? '비교적 균등' : dist.gini < 0.2 ? '중간 수준의 격차' : '격차가 큼';

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">전국 교육청 예산 정합성 분석</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
            시도교육청 17곳 · 2026 예산
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          전국 17개 시도교육청의 2026년 예산을 <strong className="text-gray-200">학생 1인당 예산</strong> 기준으로
          비교하고, 지역 간 격차·형평성·이상치를 분석합니다.
          <span className="text-gray-500"> (출처: 지방교육재정알리미 통합재정통계 / 학생수: 교육기본통계 추정)</span>
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="전국 교육예산 (2026)" value={`${summary.totalBudget.toFixed(1)}조원`} sub={`${summary.officeCount}개 시도교육청 합계`} />
        <StatCard label="전국 학생수" value={`${(summary.totalStudents / 10000).toFixed(0)}만명`} sub="초·중·고 추정" />
        <StatCard label="학생 1인당 평균예산" value={formatKRW(summary.avgPerStudent)} sub="총예산 ÷ 총학생 (가중)" />
        <StatCard label="지역 형평성 (지니)" value={dist.gini.toFixed(3)} sub={equityVerdict} />
      </div>

      {/* 학생 1인당 예산 순위 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5">
        <h2 className="text-base md:text-lg font-semibold text-gray-200 mb-1">학생 1인당 예산 순위</h2>
        <p className="text-xs text-gray-500 mb-4">막대 색상 = 권역. 농어촌 비중이 높은 도(道) 지역일수록 1인당 예산이 높습니다(소규모 학교 고정비).</p>
        <ResponsiveContainer width="100%" height={480} className="edu-hover-bar">
          <BarChart data={barData} margin={{ left: 8, right: 16, top: 8, bottom: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              type="category" dataKey="name" interval={0}
              angle={-45} textAnchor="end" height={90}
              tick={{ fill: '#d1d5db', fontSize: 11 }}
            />
            <YAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}만`} />
            <Tooltip
              cursor={false}
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: '#e5e7eb' }}
              itemStyle={{ color: '#e5e7eb' }}
              formatter={(value, _name, item) => {
                const v = Number(value);
                const p = (item as { payload?: { vsAvg: number; fullName: string } })?.payload;
                const sign = p && p.vsAvg >= 0 ? '+' : '';
                return [`${v.toLocaleString()}만원 (평균대비 ${sign}${p ? p.vsAvg.toFixed(0) : '0'}%)`, p?.fullName ?? ''];
              }}
            />
            <Bar dataKey="perStudent" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {barData.map((d, i) => (
                <Cell key={i} fill={REGION_COLOR[d.region] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          {Object.entries(REGION_COLOR).map(([r, c]) => (
            <span key={r} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c }} />{r}
            </span>
          ))}
        </div>
      </section>

      {/* 산점도 + 권역별 비교 (1행 2열) */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 산점도: 학생수 ↔ 1인당 예산 (규모의 경제) */}
        <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5">
          <h2 className="text-base md:text-lg font-semibold text-gray-200 mb-1">학생수 ↔ 1인당 예산 (규모의 경제)</h2>
          <p className="text-xs text-gray-500 mb-4">오른쪽 아래로 갈수록 "학생 많고 1인당 예산 낮음"(규모의 경제), 왼쪽 위는 "소규모·고비용".</p>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ left: 8, right: 24, top: 8, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="students" name="학생수" tickFormatter={(v) => `${v}만명`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis type="number" dataKey="perStudent" name="1인당예산" tickFormatter={(v) => `${v}만원`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <ZAxis type="number" dataKey="budget" range={[60, 600]} name="총예산" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTip />} />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={REGION_COLOR[d.region] ?? '#6b7280'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </section>

        {/* 권역별 집계 */}
        <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5">
          <h2 className="text-base md:text-lg font-semibold text-gray-200 mb-4">권역별 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-2 px-2">권역</th>
                  <th className="text-right py-2 px-2">교육청</th>
                  <th className="text-right py-2 px-2">예산</th>
                  <th className="text-right py-2 px-2">학생수</th>
                  <th className="text-right py-2 px-2">1인당 예산</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.region} className="border-b border-gray-800/50">
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-1.5 text-gray-200">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: REGION_COLOR[r.region] }} />
                        {r.region}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-gray-400">{r.officeCount}곳</td>
                    <td className="text-right py-2 px-2 text-gray-200">{r.budget.toFixed(1)}조</td>
                    <td className="text-right py-2 px-2 text-gray-400">{(r.students / 10000).toFixed(0)}만명</td>
                    <td className="text-right py-2 px-2 text-gray-100 font-semibold">{formatKRW(r.perStudent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 정합성 분석 해설 */}
      <section className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5 space-y-3">
        <h2 className="text-base md:text-lg font-semibold text-gray-200">정합성 분석 결과</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="border border-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">지역 간 격차</div>
            <p className="text-gray-200 leading-relaxed">
              최고 <strong className="text-emerald-400">{top.office.metro}</strong>({formatKRW(top.perStudent)})와
              최저 <strong className="text-amber-400">{bottom.office.metro}</strong>({formatKRW(bottom.perStudent)})의
              차이는 <strong>{dist.spread.toFixed(2)}배</strong>입니다.
            </p>
          </div>
          <div className="border border-gray-800 rounded p-3">
            <div className="text-gray-400 text-xs mb-1">형평성 지표</div>
            <p className="text-gray-200 leading-relaxed">
              변동계수 <strong>{dist.cv.toFixed(2)}</strong>, 지니계수 <strong>{dist.gini.toFixed(3)}</strong> —
              <strong className="text-blue-300"> {equityVerdict}</strong>. (0에 가까울수록 균등 배분)
            </p>
          </div>
        </div>
        <div className="border border-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">이상치 (평균 ±1.5σ 이탈)</div>
          {outliers.length === 0 ? (
            <p className="text-gray-300 text-sm">통계적 이상치가 없습니다.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {outliers.map((o) => (
                <li key={o.office.id} className="text-gray-200">
                  <strong className={o.direction === 'high' ? 'text-red-400' : 'text-amber-400'}>
                    {o.office.metro}
                  </strong>{' '}
                  — 1인당 {formatKRW(o.perStudent)} ({o.zScore >= 0 ? '+' : ''}{o.zScore.toFixed(1)}σ,{' '}
                  {o.direction === 'high' ? '평균 대비 매우 높음' : '평균 대비 매우 낮음'})
                  {o.direction === 'high' && (
                    <span className="text-gray-500"> · 농어촌 소규모학교 고정비 영향 추정</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          ※ 1인당 예산이 높다고 비효율은 아닙니다. 인구밀도가 낮은 도(道) 지역은 소규모 학교를 유지하기 위한
          고정비(시설·교원)가 학생 1인당으로 환산되어 높게 나타납니다. 도농 간 교육 형평성 관점에서 해석해야 합니다.
        </p>
      </section>

      {/* 교육지원청·학교 분석 안내 */}
      <section className="border border-gray-800 bg-gray-900/20 rounded-lg p-4 md:p-5">
        <h2 className="text-base font-semibold text-gray-300 mb-2">📂 더 깊이 보기 — 교육지원청·학교별 분석</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          위 탭의 <strong className="text-blue-300">교육지원청·학교 (183 · 8,661)</strong>에서
          전국 183개 교육지원청과 8,661개 학교의 학교회계 세출을 학생 1인당 기준으로 비교하고,
          시도 → 교육지원청 → 학교 드릴다운과 <strong className="text-gray-300">계층 정합성</strong>(학교회계가
          시도 총예산에서 차지하는 비중)을 확인할 수 있습니다. (출처: 학교알리미 OpenAPI)
        </p>
      </section>
    </div>
  );
}
