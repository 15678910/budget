'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { HS_TYPE_AGG, HS_TYPE_SIDO_AGG, HS_TYPE_TOTAL } from '@/lib/data/highschool-types';
import { formatKRW } from '@/lib/data/education-budget';

const TYPE_COLOR: Record<string, string> = {
  일반고: '#3b82f6', 특목고: '#ef4444', 특성화고: '#10b981', 자율고: '#f59e0b', 기타: '#6b7280',
};

// 2026 지방교육재정 규모 (교육부 발표) — 계층 흐름 상단
const NATIONAL_EDU_FINANCE = 106.3; // 조원
const METRO_REVENUE = 100.98;        // 시도교육청 세입총계 합 (eduinfo)
const SCHOOL_ACCOUNT = 9.27;         // 학교회계 세출 합 (학교알리미)

export function EducationTypeHierarchy() {
  const [sido, setSido] = useState('전체');
  const sidoList = useMemo(() => ['전체', ...Array.from(new Set(HS_TYPE_SIDO_AGG.map((x) => x.sido)))], []);

  const typeBar = HS_TYPE_AGG.filter((t) => t.type !== '기타').map((t) => ({
    name: t.type, perStudent: Math.round(t.perStudent / 1e4), students: t.students, schools: t.schools,
  }));

  const sidoTypeRows = useMemo(() => {
    if (sido === '전체') return HS_TYPE_AGG.filter((t) => t.type !== '기타');
    return HS_TYPE_SIDO_AGG.filter((x) => x.sido === sido && x.type !== '기타').sort((a, b) => b.students - a.students);
  }, [sido]);

  const ilban = HS_TYPE_AGG.find((t) => t.type === '일반고');
  const tukmok = HS_TYPE_AGG.find((t) => t.type === '특목고');
  const ratio = ilban && tukmok && ilban.perStudent > 0 ? (tukmok.perStudent / ilban.perStudent) : 0;

  return (
    <div className="space-y-6">
      {/* ===== A. 고교 유형별 비교 ===== */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">고교 유형별 비교</h2>
          <p className="text-sm text-gray-400 leading-relaxed mt-1">
            전국 고등학교 <strong className="text-gray-200">{HS_TYPE_TOTAL.toLocaleString()}교</strong>를 유형별로 비교합니다.
            <span className="text-gray-500"> (출처: 학교알리미 학교현황+학교회계 2024 · 영재학교는 별도법으로 미포함, 과학고·외고는 특목고에 포함)</span>
          </p>
        </div>

        {/* 유형 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HS_TYPE_AGG.filter((t) => t.type !== '기타').map((t) => (
            <div key={t.type} className="border border-gray-800 bg-gray-900/40 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: TYPE_COLOR[t.type] }} />{t.type}
              </div>
              <div className="text-lg font-bold text-gray-100 mt-1">{formatKRW(t.perStudent)}</div>
              <div className="text-[11px] text-gray-500">1인당 · {t.schools}교 · {(t.students / 10000).toFixed(1)}만명</div>
            </div>
          ))}
        </div>

        {/* 인사이트 */}
        {ratio > 0 && (
          <div className="border border-red-900/40 bg-red-950/20 rounded-lg p-3 text-sm text-red-200/90">
            🔎 <strong className="text-red-300">특목고</strong>의 학생 1인당 학교회계 예산은 <strong>{formatKRW(tukmok!.perStudent)}</strong>로,
            일반고({formatKRW(ilban!.perStudent)})의 <strong>{ratio.toFixed(1)}배</strong>입니다.
            (소규모·실험실습 중심 운영 특성 — 단순 우열이 아닌 교육과정 차이로 해석 필요)
          </div>
        )}

        {/* 유형별 1인당 예산 막대 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">유형별 학생 1인당 학교회계 예산 (만원)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeBar} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#d1d5db', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} unit="만" />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [`${Number(v).toLocaleString()}만원`, '1인당 예산']} />
              <Bar dataKey="perStudent" radius={[4, 4, 0, 0]}>
                {typeBar.map((d, i) => <Cell key={i} fill={TYPE_COLOR[d.name] ?? '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 유형×시도 표 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-300">지역별 유형 분포</h3>
            <select value={sido} onChange={(e) => setSido(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5">
              {sidoList.map((s) => <option key={s} value={s}>{s === '전체' ? '전국' : s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-2 px-2">유형</th>
                  <th className="text-right py-2 px-2">학교수</th>
                  <th className="text-right py-2 px-2">학생수</th>
                  <th className="text-right py-2 px-2">1인당 예산</th>
                </tr>
              </thead>
              <tbody>
                {sidoTypeRows.map((t) => (
                  <tr key={t.type} className="border-b border-gray-800/50">
                    <td className="py-2 px-2">
                      <span className="flex items-center gap-1.5 text-gray-200">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: TYPE_COLOR[t.type] }} />{t.type}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-gray-400">{t.schools}교</td>
                    <td className="text-right py-2 px-2 text-gray-300">{t.students.toLocaleString()}명</td>
                    <td className="text-right py-2 px-2 text-gray-100 font-semibold">{formatKRW(t.perStudent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== B. 예산 계층 흐름 ===== */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">예산 계층 흐름 — 중앙 → 시도 → 학교</h2>
          <p className="text-sm text-gray-400 leading-relaxed mt-1">
            교육예산이 중앙정부에서 학교까지 닿는 흐름. 대부분이 교원 인건비·교육청 직접집행으로,
            학교가 직접 운용하는 몫(학교회계)은 의외로 작습니다.
          </p>
        </div>

        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4 md:p-5 space-y-3">
          {/* 단계 막대 */}
          {[
            { label: '중앙 — 지방교육재정 총규모', amt: NATIONAL_EDU_FINANCE, color: '#6366f1', note: '내국세 20.79% 교부금 + 교육세 (2026 교육부 발표)' },
            { label: '시도교육청 — 세입총계(17곳)', amt: METRO_REVENUE, color: '#3b82f6', note: '지방교육재정알리미 통합재정통계 2026' },
            { label: '학교 — 학교회계 세출 직접배분', amt: SCHOOL_ACCOUNT, color: '#10b981', note: '학교알리미 학교회계 2024 (인건비 제외)' },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-300">{s.label}</span>
                <span className="text-gray-100 font-bold">{s.amt.toFixed(1)}조원</span>
              </div>
              <div className="bg-gray-800 rounded h-6 overflow-hidden">
                <div className="h-full rounded flex items-center justify-end pr-2 text-[11px] text-white/90"
                  style={{ width: `${(s.amt / NATIONAL_EDU_FINANCE) * 100}%`, background: s.color }}>
                  {((s.amt / NATIONAL_EDU_FINANCE) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.note}</div>
            </div>
          ))}
          <div className="border-t border-gray-800 pt-3 text-sm text-gray-300">
            💡 중앙 교육재정의 약 <strong className="text-emerald-400">{((SCHOOL_ACCOUNT / NATIONAL_EDU_FINANCE) * 100).toFixed(1)}%</strong>만
            학교회계로 직접 배분됩니다. 나머지는 교원 인건비(가장 큰 비중)·교육청 직접사업·시설비 등으로 집행됩니다.
          </div>
        </div>

        {/* 기초단체 한계 안내 */}
        <div className="border border-amber-900/40 bg-amber-950/20 rounded-lg p-3 text-xs text-amber-200/80">
          ⚠️ <strong className="text-amber-300">기초자치단체 교육경비보조금</strong>(기초단체가 관내 학교에 주는 지원금)은
          지방재정365가 LINK 방식으로만 제공해 자동수집이 불가합니다. 별도 출처 확보 시 본 계층에 추가 예정입니다.
        </div>
      </section>
    </div>
  );
}
